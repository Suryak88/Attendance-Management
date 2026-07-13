import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addLeaveRequest,
  cancelRequest,
  generatePDF,
  getMedicalCertificate,
  reviseRequest,
  showLeaveQuota,
  showLeaveReqHistory,
  showRevisionHistory,
} from "../controllers/tLeaveController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", authMiddleware, showLeaveReqHistory);
router.get("/quota/", authMiddleware, showLeaveQuota);
router.get("/revision/history/:id", authMiddleware, showRevisionHistory);
router.post(
  "/",
  authMiddleware,
  upload.single("medicalCertificate"),
  addLeaveRequest,
);
router.put("/cancel/:id", authMiddleware, cancelRequest);
router.put("/revise/:id", authMiddleware, reviseRequest);
router.post("/generatePDF/:id", authMiddleware, generatePDF);
router.get("/medicalCertif/:id", authMiddleware, getMedicalCertificate);

export default router;
