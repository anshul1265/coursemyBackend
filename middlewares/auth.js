import jwt from "jsonwebtoken";
import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";

// checking if the user is logged in or not
export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  // get the token from the saved cookies
  const { token } = req.cookies;
  // if we don't get the cookie then the user is not loggin in 
  if (!token) return next(new ErrorHandler("Not logged in", 401));
  // get the cookie decoded to get all the components of the cookie
  const decodedData = jwt.verify(token, process.env.JWT_Secret);
  // find the user from the id, u have got from the decoded id from the saved cookie
  req.user = await User.findById(decodedData._id);
  // then call the next middleware
  next();
});

// function to check if the user is an admin or not
export const authorizedAdmin = (req, res, next) => {
  // if the user is not an admin then he/she can't access this
  if (req.user.role !== "admin") return next(new ErrorHandler(`${req.user.role}s are not allowed to access this feature`, 403));
  // if the user is an admin then simply he/she can access the next middleware
  next();
};

// function to check if the user is a subscriber or not
export const authorizedSubscribers = (req, res, next) => {
  // if the user is not an active subscriber or admin then he/she can't access this
  if (req.user.subscription.status !== "active" && req.user.role !== "admin") return next(new ErrorHandler(`Only Subscribers can access the lectures. Please Subscibe:)`, 403));
  // if the user is an admin then simply he/she can access the next middleware
  next();
};