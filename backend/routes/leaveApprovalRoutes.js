import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  approveLeaveReq,
  approveRevision,
  bulkLeaveApprove,
  fetchSpecificLeaveRequest,
  rejectLeaveReq,
  rejectRevision,
  revokeApproval,
  showLeaveRequest,
} from "../controllers/tLeaveController.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.get("/", authMiddleware, authorizeRole("SUPERVISOR"), showLeaveRequest);
router.put(
  "/approve/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  approveLeaveReq,
);
router.put(
  "/reject/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  rejectLeaveReq,
);
router.put(
  "/reject/rev/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  rejectRevision,
);
router.put(
  "/approve/rev/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  approveRevision,
);
router.put(
  "/revoke/:id",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  revokeApproval,
);
router.put(
  "/bulk-approve/",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  bulkLeaveApprove,
);
router.get(
  "/:id/request",
  authMiddleware,
  authorizeRole("SUPERVISOR"),
  fetchSpecificLeaveRequest,
);

export default router;
