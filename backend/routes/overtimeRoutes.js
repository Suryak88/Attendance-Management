import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addOvertime,
  checkOvertime,
  showOvertime,
} from "../controllers/tOvertimeController.js";

const router = express.Router();

router.post("/", authMiddleware, addOvertime);
router.get("/", authMiddleware, showOvertime);
router.get("/check/", authMiddleware, checkOvertime);

export default router;
