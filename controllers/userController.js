import crypto from "crypto";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import { Stats } from "../models/Stats.js";

// register function for the user
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const file = req.file;
  if (!name || !email || !password || !file) return next(new ErrorHandler("Please enter all the fields", 400));
  let user = await User.findOne({ email });
  // if user already exists
  if (user) return next(new ErrorHandler("User already exists.", 409));
  // upload file on the cloudinary
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);
  // creating the user in the database
  user = await User.create({
    name, email, password,
    avatar: {
      publicId: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  sendToken(res, user, "Registered Successfully", 201);
});

// login function for the user
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ErrorHandler("Please enter all the fields", 400));
  // finding the user with its email
  const user = await User.findOne({ email }).select("+password");
  // if entered invalid credentials then do this
  if (!user) return next(new ErrorHandler("Please enter valid credentials", 401));
  // comparing to password to perform login
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new ErrorHandler("Please enter valid credentials", 401));
  sendToken(res, user, `Welcome back, ${user.name}`, 200);
});

// logout function for the user
export const logout = catchAsyncError(async (req, res, next) => {
  // deleting the cookie to logout 
  res.status(200).cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  }).json({
    success: true,
    message: "successfully logged out!",
  });
});

// get the profile of the user
export const getMyProfile = catchAsyncError(async (req, res, next) => {
  // getting the user with its id
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    user,
  });
});

// update the password of the user
export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || !oldPassword) return next(new ErrorHandler("Please enter all the fields", 400));
  // finding the user and also selecting its password becoz we have to modify password only
  const user = await User.findById(req.user._id).select("+password");
  // comparing the oldPassword with the password in the database
  const isMatch = await user.comparePassword(oldPassword);
  // if old password is not matched
  if (!isMatch) return next(new ErrorHandler("Incorrect Old Password", 400));
  // modifying the password of the user
  user.password = newPassword;
  // saving the user with new password
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
  });
});

// update the profile of the user
export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);
  // changing the name and the email of the user
  if (name) user.name = name;
  if (email) user.email = email;
  // saving the user with updated Profile
  await user.save();
  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});

// delete my profile
export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found!", 400));
  // deleting the user avatar from the cloudinary
  if (user.avatar) await cloudinary.v2.uploader.destroy(user.avatar.publicId);
  // deleting the user from the database
  await user.deleteOne({ _id: req.params.id });
  // sending the message and deleting the token
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Successfully deleted!"
    });
});

// update the profile picture of the user
export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  // uploading the file to the cloudinary
  const file = req.file;
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);
  // destroying the previous avatar from the cloudinary
  if (user.avatar) {
    await cloudinary.v2.uploader.destroy(user.avatar.publicId);
  }
  // setting the new avatar for the user
  user.avatar = {
    publicId: myCloud.public_id,
    url: myCloud.secure_url,
  };
  // saving the new avatar in the database
  await user.save();
  res.status(200).json({
    success: true,
    message: "Profile Picture Updated Successfully",
  });
});

// if the user forgets its password
export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ErrorHandler("Please enter the email", 400));
  const user = await User.findOne({ email });
  // if user email is not found
  if (!user) return next(new ErrorHandler("User not found for this email", 400));
  // here we will get the reset token
  const resetToken = await user.getResetToken();
  // saving the reset token in the database
  await user.save();

  // by this the user will go to the reset password url
  const url = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
  // message which will be sent to the email
  const message = `Click on the link to reset the password ${url}. If you have not requested for this email, then please ignore it.`;

  // send a mail to reset the password
  await sendEmail(user.email, "CourseBundler Reset Password", message)
  res.status(200).json({
    success: true,
    message: `Code to reset Password has been to ${user.email}`,
  });
});

// function to reset the password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  // finding the user with the reset password token
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now()
    }
  });
  // if user is not found with the token
  if (!user) return next(new ErrorHandler("Token is invalid or expired", 401));
  // setting the password and removing the token from the database
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password has been reset Successfully",
  });
});

// function to add to a playlist
export const addToPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  // finding the course through its id from the body
  const course = await Course.findById(req.body.id);
  if (!course) return next(new ErrorHandler("Invalid Course id!", 404));
  // checking if the course already exist in the user playlist
  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) return true;
  })
  // like if the course is already present in the user playlist, then we will not add it.
  if (itemExist) return next(new ErrorHandler("Item already exists"), 409);
  // adding the course to the user Playlist
  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });
  // saving the user with the course added to its playlist
  await user.save();
  res.status(200).json({
    success: true,
    message: "Course has been successfully added to your playlist:)",
  });
});

// function to remove a playlist
export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  // finding the course through its id from the body
  const course = await Course.findById(req.query.id);
  if (!course) return next(new ErrorHandler("Invalid Course id!", 404));
  // adding the item that we don't want to delete in a new array
  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) return item;
  });
  // changing the playlist in the database with the new playlist
  user.playlist = newPlaylist;
  // saving the user with the course added to its playlist
  await user.save();
  res.status(200).json({
    success: true,
    message: "Successfully Removed!",
  });
});

// ----------------------------------Admin Controllers

// get all the users
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  // getting all the users
  const users = await User.find({});
  res.status(200).json({
    success: true,
    users,
  });
});

// update the role of a user
export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found!", 400));
  // changing the role of the user
  (user.role == "admin") ? (user.role = "user") : (user.role = "admin");
  await user.save();
  res.status(200).json({
    success: true,
    message: "Successfully update the role:)"
  });
});

// delete the user
export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found!", 400));
  // deleting the user avatar from the cloudinary
  if (user.avatar) await cloudinary.v2.uploader.destroy(user.avatar.publicId);
  // deleting the user from the database
  await user.deleteOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "Successfully deleted!"
  });
});

// any change in User database will update the stats

User.watch().on("change", async () => {
  try {
    // Getting the stats of the current month
    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
    // Finding how many users have an active subscription
    const subscriptionCount = await User.countDocuments({ "subscription.status": "active" });
    // Updating the stats
    stats[0].users = await User.countDocuments();
    stats[0].subscriptions = subscriptionCount;
    stats[0].createdAt = new Date(Date.now());
    // Saving the stats
    await stats[0].save();
  } catch (error) {
    console.error(error);
  }
});