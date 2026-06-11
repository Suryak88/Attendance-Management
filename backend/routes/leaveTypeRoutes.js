import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getLeaveType,
  addLeaveType,
  editLeaveType,
  deleteLeaveType,
} from "../controllers/mLeaveController.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.get("/LT", authMiddleware, getLeaveType);

router.post("/", authMiddleware, authorizeRole("SUPERVISOR"), addLeaveType);
router.put("/:id", authMiddleware, authorizeRole("SUPERVISOR"), editLeaveType);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  deleteLeaveType,
);

export default router;
