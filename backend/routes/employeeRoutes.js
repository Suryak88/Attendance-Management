import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { fetchAllEmployee } from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", authMiddleware, fetchAllEmployee);

export default router;
