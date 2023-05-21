import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

// schema for the user in the database
const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: validator.isEmail,
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [6, "Password must be atleast 6 character long"],
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  subscription: {
    id: {
      type: String
    },
    status: {
      type: String
    },
  },
  avatar: {
    publicId: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  playlist: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      poster: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: String,
});

// before saving the user, this function will hash the password
schema.pre("save", async function (next) {
  // if the password is not modified, then it will not hash the password
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// this is used to get the jwt token
schema.methods.getJWTToken = function () {
  // it creates the token using the id of the user
  return jwt.sign({ _id: this._id }, process.env.JWT_Secret, {
    expiresIn: "15d",
  });
};

// this function is used to compare the password entered with the password present in the database
schema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// it generates a token to reset the password
schema.methods.getResetToken = async function () {
  // getting the random bytes hex string using the crypto 
  const resetToken = crypto.randomBytes(20).toString("hex");
  // creating the hash of the reset token
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  // setting the expire time of crypto token to 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

export const User = mongoose.model("user", schema);