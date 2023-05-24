import express from "express";
import { register, login, logout, getMyProfile, changePassword, updateProfile, updateProfilePicture, forgetPassword, resetPassword, addToPlaylist, removeFromPlaylist, getAllUsers, updateUserRole, deleteUser, deleteMyProfile } from "../controllers/userController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

// to register a new user
router.route("/register").post(singleUpload, register);

// login
router.route("/login").post(login);

// logout
router.route("/logout").delete(logout);

// getMyProfile -> in it only the user which is authenticated can go to this route and get the profile
router.route("/me")
  .get(isAuthenticated, getMyProfile)
  .delete(isAuthenticated, deleteMyProfile);

// changePassword
router.route("/changePassword").put(isAuthenticated, changePassword);

// updateProfile
router.route("/updateProfile").put(isAuthenticated, updateProfile);

// updateProfilePicture
router.route("/updateProfilePicture").put(isAuthenticated, singleUpload, updateProfilePicture);

// ForgetPassword
router.route("/forgetPassword").post(forgetPassword);

// ResetPassword
router.route("/resetPassword/:token").put(resetPassword);

// AddToPlaylist
router.route("/addToPlaylist").post(isAuthenticated, addToPlaylist);

// RemovePlaylist
router.route("/removeFromPlaylist").delete(isAuthenticated, removeFromPlaylist);

// --------------------------Admin Routes

// get all the users
router.route("/admin/users").get(isAuthenticated, authorizedAdmin, getAllUsers);

// update the role of the user
router.route("/admin/user/:id")
  .put(isAuthenticated, authorizedAdmin, updateUserRole)
  .delete(isAuthenticated, authorizedAdmin, deleteUser);

export default router;