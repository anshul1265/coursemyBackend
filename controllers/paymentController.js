import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { instance } from "../server.js";
import crypto from "crypto";
import { Payment } from "../models/Payment.js";

// function to buy subscription through razorpay
export const buySubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  // if the user is an admin, then he/she need not to buy the subscription
  if (user.role === "admin") return next(new ErrorHandler("Admins need not to buy the subscription", 400));
  // getting the plan id
  const plan_id = process.env.PLAN_ID;
  // calling the instance created for razorpay in server.js and conforming the subscription
  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });
  // // Initialize the subscription object if it doesn't exist
  // if (!user.subscription) {
  //   user.subscription = {};
  // }
  // updating the subscription in the database
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;
  await user.save();
  res.status(201).json({
    success: true,
    message: "Subscription successfully:)",
    subscriptionId: subscription.id,
  })
});

// function to verify the payments
export const paymentVerification = catchAsyncError(async (req, res, next) => {
  const { razorpay_signature, razorpay_subscription_id, razorpay_payment_id } = req.body;
  const user = await User.findById(req.user._id);
  const subscription_id = user.subscription.id;
  // using the crypto to get the signature from the payment id and the subscription id to compare
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");
  // checking the authenticity by using the signatures
  const isAuthentic = (generated_signature === razorpay_signature);
  // if not authentic user then payment fails
  if (!isAuthentic) return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`)
  // creating a new Payment object in the database
  await Payment.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });
  // updating the data of user in the database
  user.subscription.status = "active";
  await user.save();
  // sending the result back
  res.redirect(`${process.env.FRONTEND_URL}/paymentsuccess/reference=${razorpay_payment_id}`);
});

// function to get the razorpay key
export const getRazorpayKey = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});

// function to cancel the subscription
export const cancelSubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const subscriptionId = user.subscription.id;
  // initially taking the refund variable as false
  let refund = false;
  // cancelling the subscription
  await instance.subscriptions.cancel(subscriptionId);
  // finding the payment in the Payment database
  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });
  // finding the time(when the payment is done) to check if we have to refund or not
  const gap = Date.now() - payment.createdAt;
  const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;
  // checking if we have to make a refund or not
  if (gap < refundTime) {
    await instance.payments.refund(payment.razorypay_payment_id);
    refund = true;
  }
  // updating the Payment and the User database
  await payment.deleteOne();
  user.subscription.id = undefined;
  user.subscription.status = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: refund ? "Subscription cancelled. Refund will be granted within 7 days." : "Subscription cancelled. No refund after 7 days.",
  });
});