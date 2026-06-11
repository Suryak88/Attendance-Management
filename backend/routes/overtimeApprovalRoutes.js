import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  approveOvertimeReq,
  bulkApproveOvertime,
  rejectOvertimeReq,
  showOvertimeRequest,
} from "../controllers/tOvertimeController.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  showOvertimeRequest,
);
router.put(
  "/reject/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  rejectOvertimeReq,
);
router.put(
  "/approve/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  approveOvertimeReq,
);
router.put(
  "/bulk-approve/",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  bulkApproveOvertime,
);

export default router;
