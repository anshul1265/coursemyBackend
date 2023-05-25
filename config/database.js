import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config({ path: "./config.env" });

// connecting the database using mongoose
export const connectDB = async () => {
  const { connection } = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected with ${connection.host}`);
}