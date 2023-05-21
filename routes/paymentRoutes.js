import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { buySubscription, cancelSubscription, getRazorpayKey, paymentVerification } from "../controllers/paymentController.js";

const router = express.Router();

// buy the subscription
router.route("/subscribe").get(isAuthenticated, buySubscription);

// verifying the payment done by the user and saving its reference in the database
router.route("/paymentVerification").get(isAuthenticated, paymentVerification);

// get the razorpay key
router.route("/getRazorpayKey").get(getRazorpayKey);

// cancel the subscription
router.route("/subscribe/cancel").delete(isAuthenticated, cancelSubscription);

export default router;