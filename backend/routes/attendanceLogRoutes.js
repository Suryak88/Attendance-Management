import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getLog } from "../controllers/attendanceLogController.js";

const router = express.Router();

router.get("/log", authMiddleware, getLog);

export default router;
