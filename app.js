import express from "express";
import dotenv from 'dotenv';
import { ErrorMiddleware } from "./middlewares/Error.js"
import cookieParser from 'cookie-parser';
import cors from "cors";

dotenv.config({ path: "./config/config.env" });
const app = express();

// using middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// cors are required becoz if we don't give it, we can't request to another website through the server
app.use(cors({
  // only the origin website is allowed
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT"],
}));


// Importing and using the routes
import Course from "./routes/courseRoutes.js";
import User from './routes/userRoutes.js';
import Payment from "./routes/paymentRoutes.js";
import Other from "./routes/otherRoutes.js";

app.use("/api/v1", Course);
app.use("/api/v1", User);
app.use("/api/v1", Payment);
app.use("/api/v1", Other);

export default app;

app.get("/", (req, res, next) => {
  res.send(`<h1>Site is working. Click <a href=${process.env.FRONTEND_URL}>here</a> to go to frontend.</h1>`)
});

// this is always called at the last when there is nothing to display
app.use(ErrorMiddleware);

// v1 complete