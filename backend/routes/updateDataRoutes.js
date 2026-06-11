import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { updateDataHadirr } from "../controllers/hadirrController.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRole("ADMIN"), updateDataHadirr);

export default router;
