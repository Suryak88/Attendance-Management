import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  showReport,
  generateReportPDF,
  printAllReport,
  submitSolveConflict,
  fetchCloseAttendanceStatus,
  showLatePenalty,
  generatePenaltyPDF,
  getEmployeeHRD,
} from "../controllers/tAbsensiController.js";
import { submitCloseAttendance } from "../controllers/tAttendanceCloseController.js";

const router = express.Router();

router.get("/", authMiddleware, showReport);
router.post("/", authMiddleware, submitCloseAttendance);
router.post("/printAll/", authMiddleware, printAllReport);
router.post("/generate-pdf/", authMiddleware, generateReportPDF);
router.post("/solveConflict/", authMiddleware, submitSolveConflict);
router.post("/closeStatus/", authMiddleware, fetchCloseAttendanceStatus);
router.get("/attendancePenalty/", authMiddleware, showLatePenalty);
router.post("/generate-penalty-PDF/", authMiddleware, generatePenaltyPDF);
router.get("/employee/", authMiddleware, getEmployeeHRD);

export default router;
