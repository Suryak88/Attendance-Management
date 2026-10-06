import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createNotifUpdateDataPresensi,
  fetchNotification,
  markAllAsRead,
  markAsRead,
} from "../controllers/notificationController.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.get("/", authMiddleware, fetchNotification);
router.put("/:id/read", authMiddleware, markAsRead);
router.post(
  "/updateDataPresensi",
  authMiddleware,
  authorizeRole("ADMIN"),
  createNotifUpdateDataPresensi,
);
router.put("/readAll", authMiddleware, markAllAsRead);

export default router;
