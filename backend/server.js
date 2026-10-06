import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import attendanceLogRoutes from "./routes/attendanceLogRoutes.js";
import leaveTypeRoutes from "./routes/leaveTypeRoutes.js";
import leaveRequestRoutes from "./routes/leaveRequestRoutes.js";
import leaveApprovalRoutes from "./routes/leaveApprovalRoutes.js";
import attenndanceCorrectionRoutes from "./routes/attendanceCorrectionRoutes.js";
import correctionApprovalRoutes from "./routes/correctionApprovalRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import overtimeRoutes from "./routes/overtimeRoutes.js";
import overtimeApprovalRoutes from "./routes/overtimeApprovalRoutes.js";
import attendanceReportRoutes from "./routes/attendanceReportRoutes.js";
import leaveUsageRoutes from "./routes/leaveUsageRoutes.js";
import updateDataRoutes from "./routes/updateDataRoutes.js";
import employeeFormRoutes from "./routes/employeeFormRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import cookieParser from "cookie-parser";
import { startAttendanceCron } from "./jobs/attendanceCron.js";
import { startOvertimeCron } from "./jobs/overtimeCron.js";
import { deleteNotifCron } from "./jobs/deleteNotifCron.js";

dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/attendanceLog", attendanceLogRoutes);
app.use("/api/attendanceReport", attendanceReportRoutes);
app.use("/api/leaveType", leaveTypeRoutes);
app.use("/api/leaveRequest", leaveRequestRoutes);
app.use("/api/leaveApproval", leaveApprovalRoutes);
app.use("/api/attendanceCorrection", attenndanceCorrectionRoutes);
app.use("/api/correctionApproval", correctionApprovalRoutes);
app.use("/api/holiday", calendarRoutes);
app.use("/api/overtime", overtimeRoutes);
app.use("/api/overtimeApproval", overtimeApprovalRoutes);
app.use("/api/leaveUsage", leaveUsageRoutes);
app.use("/api/hadirr", updateDataRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/employeeForm", employeeFormRoutes);
app.use("/api/notification", notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // startAttendanceCron(); dimatikan dlu sementara auto closenya karena data2 belum semua rapih dan stabil
  startOvertimeCron();
  deleteNotifCron();
});

//SETUP SERVER DASAR (SERVER.JS)
//KONEKSI KE DB (DB.JS) + ENV
//ROUTE LOGIN userRoute.js
//user controller

// cd front tambahin state, handle, dan krim props di login
