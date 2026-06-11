import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addCorrection,
  cancelCorrectionRequest,
  showCorrectionReqHistory,
} from "../controllers/tCorrectionController.js";

const router = express.Router();

router.get("/", authMiddleware, showCorrectionReqHistory);
router.post("/", authMiddleware, addCorrection);
router.put("/cancel/:id", authMiddleware, cancelCorrectionRequest);

export default router;
