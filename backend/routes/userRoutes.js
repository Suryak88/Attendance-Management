import express from "express";
import { changePassword, loginUser } from "../controllers/userController.js";
import {
  logoutUser,
  refreshAccessToken,
  userSubordinates,
} from "../controllers/refreshController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.get("/subordinates", authMiddleware, userSubordinates);
router.post("/updatePW", authMiddleware, changePassword);

export default router;
