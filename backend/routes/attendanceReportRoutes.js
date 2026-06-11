import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  showReport,
  generateReportPDF,
  printAllReport,
  submitSolveConflict,
  fetchCloseAttendanceStatus,
} from "../controllers/tAbsensiController.js";
import { submitCloseAttendance } from "../controllers/tAttendanceCloseController.js";

const router = express.Router();

router.get("/", authMiddleware, showReport);
router.post("/", authMiddleware, submitCloseAttendance);
router.post("/printAll/", authMiddleware, printAllReport);
router.post("/generate-pdf/", authMiddleware, generateReportPDF);
router.post("/solveConflict/", authMiddleware, submitSolveConflict);
router.post("/closeStatus/", authMiddleware, fetchCloseAttendanceStatus);

export default router;
