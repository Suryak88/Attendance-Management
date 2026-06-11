import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addLeaveRequest,
  cancelRequest,
  generatePDF,
  reviseRequest,
  showLeaveQuota,
  showLeaveReqHistory,
  showRevisionHistory,
} from "../controllers/tLeaveController.js";

const router = express.Router();

router.get("/", authMiddleware, showLeaveReqHistory);
router.get("/quota/", authMiddleware, showLeaveQuota);
router.get("/revision/history/:id", authMiddleware, showRevisionHistory);
router.post("/", authMiddleware, addLeaveRequest);
router.put("/cancel/:id", authMiddleware, cancelRequest);
router.put("/revise/:id", authMiddleware, reviseRequest);
router.post("/generatePDF/:id", authMiddleware, generatePDF);

export default router;
