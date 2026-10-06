import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addOvertime,
  checkOvertime,
  fetchSpecificEmployeeOvertime,
  showOvertime,
} from "../controllers/tOvertimeController.js";

const router = express.Router();

router.post("/", authMiddleware, addOvertime);
router.get("/", authMiddleware, showOvertime);
router.get("/check/", authMiddleware, checkOvertime);
router.get("/:id/request", authMiddleware, fetchSpecificEmployeeOvertime);

export default router;
