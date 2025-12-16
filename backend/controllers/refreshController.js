import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export async function refreshAccessToken(req, res) {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const [rows] = await pool.query(
      "SELECT * FROM m_users WHERE regnum = ? AND fl_hapus != 1",
      [decoded.regnum]
    );
    const user = rows[0];

    if (!user) return res.status(404).json({ message: "User Not Found" });

    const newAccessToken = jwt.sign(
      { regnum: decoded.regnum },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      accessToken: newAccessToken,
      user: { username: user.nama },
    });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token expired" });
  }
}

export function logoutUser(req, res) {
  res.clearCookie("refreshToken", { path: "/", domain: "localhost" });
  res.json({ message: "Logged out" });
}
