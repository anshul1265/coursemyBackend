import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import { Course } from '../models/Course.js';
import { Stats } from '../models/Stats.js';
import getDataUri from '../utils/dataUri.js';
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";

// it will help us get all the courses
export const getAllCourses = catchAsyncError(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";
  // here we are getting all the courses without the lectures and also using regular expressions with case insensitive
  const courses = await Course.find({
    title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },
  }).select("-lectures");
  res.status(200).json({
    success: true,
    courses,
  });
});

// function to create the course
export const createCourse = catchAsyncError(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;
  // if anything is not present in the course which is required
  if (!title || !description || !category || !createdBy)
    return next(new ErrorHandler("Please fill out all the fields", 400));
  // getting the file of the course from the user
  const file = req.file;
  // saving the url of the file to fileUri
  const fileUri = getDataUri(file);
  // uploading the fileUri content to the cloudinary and getting the public_id and secure_url
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);
  // creating the course with the data
  await Course.create({
    title, description, category, createdBy, poster: {
      publicId: myCloud.public_id,
      url: myCloud.secure_url,
    },
  })
  res.status(201).json({
    success: true,
    message: "Course Created Successfully:) You can add lectures now.",
  });
});

// function to delete the course
export const deleteCourse = catchAsyncError(async (req, res, next) => {
  // getting the course to be deleted
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ErrorHandler("Course not found", 404));
  // deleting the poster of the course, also from the cloudinary
  await cloudinary.v2.uploader.destroy(course.poster.publicId);
  // deleting the lectures of the course, also from the cloudinary
  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.video.publicId, {
      resource_type: "video",
    });
  }
  // deleting the whole course from the database
  await course.deleteOne(course._id);
  res.status(200).json({
    success: true,
    message: "Course deleted Successfully",
  });
});

// getting all the lectures present inside a course 
export const getCourseLectures = catchAsyncError(async (req, res, next) => {
  const courseId = req.params.id;
  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorHandler("Course not found!", 404));
  // increasing the no. of views of the course
  course.views += 1;
  // saving the details of the course
  await course.save();
  res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});

// adding a lecture to a course ---- maximum lecture size is 100MB(cloudinary limit)
export const addLecture = catchAsyncError(async (req, res, next) => {
  // getting the details from the body and params
  const id = req.params.id;
  const { title, description } = req.body;
  // finding the course with its id
  const course = await Course.findById(id);
  if (!course) return next(new ErrorHandler("Course not found!", 404));
  // upload the file here
  const file = req.file;
  if (!title || !description || !file) return next(new ErrorHandler("Please enter all the fields", 400));
  // getting the uri of the file
  const fileUri = getDataUri(file);
  // uploading the file to the cloudinary and getting its public_id and secure_url
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });
  // adding the lecture to the course
  course.lectures.push({
    title,
    description,
    video: {
      publicId: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  // updating the no. of lectures in the course
  course.numOfVideos = course.lectures.length;
  // saving the details of the course
  await course.save();
  res.status(200).json({
    success: true,
    message: "lecture successfully added to the course:)",
  });
});

// function to delete the lecture from a course
export const deleteLecture = catchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;
  // getting the course in which lecture has to be deleted
  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorHandler("Course not found", 404));
  // getting the lecture which has to be deleted
  const lecture = course.lectures.find(async (item) => {
    if (item._id.toString() === lectureId.toString()) return item;
  });
  // deleting the lecture from the cloudinary
  await cloudinary.v2.uploader.destroy(lecture.video.publicId, {
    resource_type: "video",
  });
  // deleting the lecture from the database
  course.lectures = course.lectures.filter(item => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });
  // updating the database with the changes
  course.numOfVideos = course.lectures.length;
  await course.save();
  res.status(200).json({
    success: true,
    message: "Lecture deleted Successfully",
  });
});

// any change in the courses will update the stats

Course.watch().on("change", async () => {
  try {
    // Getting the stats of the current month
    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
    // Getting all the courses
    const courses = await Course.find({});
    // Calculating the total number of views on all the courses
    let totalViews = 0;
    for (let i = 0; i < courses.length; i++) {
      totalViews += courses[i].views;
    }
    // Updating the stats
    stats[0].views = totalViews;
    stats[0].createdAt = new Date(Date.now());
    // Saving the stats
    await stats[0].save();
  } catch (error) {
    console.error(error);
  }
});