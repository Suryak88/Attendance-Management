import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  fetchLeaveUsage,
  fetchLeaveUsageSummary,
  fetchLeaveYear,
} from "../controllers/tLeaveController.js";

const router = express.Router();

router.get("/", authMiddleware, fetchLeaveUsage);
router.get("/summary", authMiddleware, fetchLeaveUsageSummary);
router.get("/leaveYear", authMiddleware, fetchLeaveYear);

export default router;
