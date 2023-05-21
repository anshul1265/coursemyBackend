import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { Stats } from "../models/Stats.js";

// function for the contact form 
export const contact = catchAsyncError(async (req, res, next) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return next(new ErrorHandler("Please enter all the fields.", 400));
  // making the format to be sent via mail
  const to = process.env.MY_MAIL;
  const subject = "Contact form courseBundler";
  const text = `I am ${name} and my email is ${email}.\n${message}`;
  // sending the data to the mail
  await sendEmail(to, subject, text);
  res.status(200).json({
    success: true,
    message: "Your message has been sent successfully:)",
  });
});

// function for the request form
export const courseRequest = catchAsyncError(async (req, res, next) => {
  const { name, email, course } = req.body;
  if (!name || !email || !course) return next(new ErrorHandler("Please enter all the fields.", 400));
  // formatting the email
  const to = process.env.MY_MAIL;
  const subject = "Requesting for a course at courseBundler";
  const text = `I am ${name} and my email is ${email}.\n${course}`;
  // sending the mail
  sendEmail(to, subject, text);
  res.status(200).json({
    success: true,
    message: "Your Request has been successfully sent.",
  });
});

// function for the admin to get dashboard stats
export const getDashboardStats = catchAsyncError(async (req, res, next) => {
  // getting the stats in descending order and only 12 from the database
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(12);
  // this is the whole data to be showed to the admin
  const statsData = [];
  // getting all the data that is present in the database
  for (let i = 0; i < stats.length; i++) {
    statsData.unshift(stats[i]);
  }
  // how much more data is required to show
  const requiredSize = 12 - stats.length;
  // filling the rest of the data to be shown with 0
  for (let i = 0; i < requiredSize; i++) {
    statsData.unshift({
      users: 0,
      subscriptions: 0,
      views: 0,
    });
  }
  // getting the count of the stats for the current month
  const usersCount = statsData[11].users;
  const subscriptionCount = statsData[11].subscriptions;
  const viewsCount = statsData[11].views;
  // declaring variable to be used for calculations
  let usersProfit = true, subscriptionProfit = true, viewsProfit = true;
  let usersPercentage = 0, subscriptionPercentage = 0, viewsPercentage = 0;
  // calculations if data of previous month not present
  if (statsData[10].users === 0) usersPercentage = usersCount * 100;
  if (statsData[10].views === 0) viewsPercentage = viewsCount * 100;
  if (statsData[10].subscriptions === 0) subscriptionPercentage = subscriptionCount * 100;
  else {
    // calculating the difference in numbers from the previous month
    const difference = {
      users: statsData[11].users - statsData[10].users,
      views: statsData[11].views - statsData[10].views,
      subscriptions: statsData[11].subscriptions - statsData[10].subscriptions,
    };
    // calculating the percentage increase or decrease
    usersPercentage = (difference.users / statsData[10].users) * 100;
    viewsPercentage = (difference.views / statsData[10].views) * 100;
    subscriptionPercentage = (difference.subscriptions / statsData[10].subscriptions) * 100;
    // checking if we are getting profit or loss
    if (usersPercentage < 0) usersProfit = false;
    if (viewsPercentage < 0) viewsProfit = false;
    if (subscriptionPercentage < 0) subscriptionProfit = false;
  }
  // sending all the data
  res.status(200).json({
    success: true,
    stats: statsData,
    usersCount,
    subscriptionCount,
    viewsCount,
    usersProfit,
    subscriptionProfit,
    viewsProfit,
    usersPercentage,
    subscriptionPercentage,
    viewsPercentage,
  });
});