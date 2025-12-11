import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import attendanceLogRoutes from "./routes/attendanceLogRoutes.js";
import leaveTypeRoutes from "./routes/leaveTypeRoutes.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendanceLog", attendanceLogRoutes);
app.use("/api/leaveType", leaveTypeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//SETUP SERVER DASAR (SERVER.JS)
//KONEKSI KE DB (DB.JS) + ENV
//ROUTE LOGIN userRoute.js
//user controller

// cd front tambahin state, handle, dan krim props di login
