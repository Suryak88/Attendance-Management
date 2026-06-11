import jwt from "jsonwebtoken";
import dbAbsensi from "../config/dbAbsensi.js";

export async function refreshAccessToken(req, res) {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const [rows] = await dbAbsensi.query(
      "SELECT * FROM m_users WHERE regnum = ? AND fl_hapus != 1",
      [decoded.regnum],
    );
    const user = rows[0];

    if (!user) return res.status(404).json({ message: "User Not Found" });

    const [[role]] = await dbAbsensi.query(
      "SELECT role FROM reg_person WHERE regnum = ?",
      [decoded.regnum],
    );

    const newAccessToken = jwt.sign(
      { regnum: decoded.regnum, role: role.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    return res.json({
      accessToken: newAccessToken,
      user: { username: user.nama, regnum: user.regnum, role: role.role },
    });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token expired" });
  }
}

export function logoutUser(req, res) {
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ message: "Logged out" });
}

export async function userSubordinates(req, res) {
  try {
    const regnum = req.user.regnum;

    const [rows] = await dbAbsensi.query(
      `SELECT * FROM reg_person WHERE regnum = ? OR approver = ? ORDER BY CASE WHEN regnum = ? THEN 0 ELSE 1 END, namalengkap`,
      [regnum, regnum, regnum],
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}
