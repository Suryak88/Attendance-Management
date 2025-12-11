import express from "express";
import { loginUser } from "../controllers/userController.js";
import {
  logoutUser,
  refreshAccessToken,
} from "../controllers/refreshController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

export default router;
