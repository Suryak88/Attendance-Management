import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getLeaveType,
  addLeaveType,
  editLeaveType,
  deleteLeaveType,
} from "../controllers/mLeaveController.js";

const router = express.Router();

router.get("/LT", authMiddleware, getLeaveType);

router.post("/", authMiddleware, addLeaveType);
router.put("/:id", authMiddleware, editLeaveType);
router.delete("/:id", authMiddleware, deleteLeaveType);

export default router;
