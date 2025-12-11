import express from "express";
import { getPunctuality } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/punctuality", authMiddleware, getPunctuality);

export default router;
