import express from "express";
import { contact, courseRequest, getDashboardStats } from "../controllers/otherController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// contact form
router.route("/contact").post(contact);

// request form
router.route("/courseRequest").post(courseRequest);

// get admin dashboard stats
router.route("/admin/stats").get(isAuthenticated, authorizedAdmin, getDashboardStats)

export default router;