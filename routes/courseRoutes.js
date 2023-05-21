import express from "express";
import { getAllCourses, createCourse, getCourseLectures, addLecture, deleteCourse, deleteLecture } from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import { authorizedAdmin, authorizedSubscribers, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// get all the courses without the lectures
router.route("/courses").get(getAllCourses);

// add a new course -> admin only access
router.route("/createCourse").post(isAuthenticated, authorizedAdmin, singleUpload, createCourse);

// add lecture, delete course, get course details
router.route("/course/:id")
  .get(isAuthenticated, authorizedSubscribers, getCourseLectures)
  .post(isAuthenticated, authorizedAdmin, singleUpload, addLecture)
  .delete(isAuthenticated, authorizedAdmin, deleteCourse);

// delete lecture
router.route("/lecture").delete(isAuthenticated, authorizedAdmin, deleteLecture);

export default router;