import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addCorrection,
  cancelCorrectionRequest,
  fetchLastSynced,
  fetchSpecificEmployeeCorrection,
  showCorrectionReqHistory,
} from "../controllers/tCorrectionController.js";

const router = express.Router();

router.get("/", authMiddleware, showCorrectionReqHistory);
router.post("/", authMiddleware, addCorrection);
router.put("/cancel/:id", authMiddleware, cancelCorrectionRequest);
router.get("/lastSynced/", authMiddleware, fetchLastSynced);
router.get("/:id/request", authMiddleware, fetchSpecificEmployeeCorrection);

export default router;
