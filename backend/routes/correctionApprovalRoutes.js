import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  approveCorrectionReq,
  bulkCorrectionApprove,
  fetchSpecificCorrectionRequest,
  rejectCorrectionReq,
  showCorrectionRequest,
} from "../controllers/tCorrectionController.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  showCorrectionRequest,
);
router.put(
  "/approve/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  approveCorrectionReq,
);
router.put(
  "/reject/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  rejectCorrectionReq,
);
router.put(
  "/bulk-approve/",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  bulkCorrectionApprove,
);
router.get(
  "/:id/request",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  fetchSpecificCorrectionRequest,
);

export default router;
