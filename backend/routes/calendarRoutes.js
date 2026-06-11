import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { fetchHoliday } from "../controllers/workCalendarController.js";

const router = express.Router();

router.get("/:month", authMiddleware, fetchHoliday);

export default router;
