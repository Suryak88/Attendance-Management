import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbAbsensi = mysql.createPool({
  host: process.env.DB_ABS_HOST,
  user: process.env.DB_ABS_USER,
  password: process.env.DB_ABS_PASS,
  database: process.env.DB_ABS_NAME,
});

export default dbAbsensi;
