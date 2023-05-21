import mongoose from "mongoose";

// schema for the courses in the database
const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter the title"],
    minLength: [4, "Title must be atleast 4 characters"],
    maxLength: [80, "Title can not be more than 80 characters"],
  },
  description: {
    type: String,
    required: [true, "Please enter the description"],
    minLength: [20, "Description must be atleast 20 characters"],
  },
  lectures: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      video: {
        publicId: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    },
  ],
  poster: {
    publicId: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  views: {
    type: Number,
    default: 0,
  },
  numOfVideos: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: [true, "Enter Course creator name"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


export const Course = mongoose.model("Course", schema);