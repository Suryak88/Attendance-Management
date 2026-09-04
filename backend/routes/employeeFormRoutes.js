import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import {
  addEmployee,
  editEmployee,
  fetchEmployeeForEdit,
  getInitialForm,
} from "../controllers/employeeController.js";

const router = express.Router();

// router.post("/", authMiddleware, authorizeRole("ADMIN"), updateDataHadirr);
router.get("/", authMiddleware, authorizeRole("ADMIN"), getInitialForm);
router.post("/", authMiddleware, authorizeRole("ADMIN"), addEmployee);
router.get(
  "/:regnum",
  authMiddleware,
  authorizeRole("ADMIN"),
  fetchEmployeeForEdit,
);
router.put("/:regnum", authMiddleware, authorizeRole("ADMIN"), editEmployee);

export default router;
