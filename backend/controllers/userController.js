import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

function md5Hash(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function loginUser(req, res) {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM m_users WHERE card_id = ?", [
      username,
    ]);
    const user = rows[0];

    if (!user) return res.status(404).json({ message: "User Not Found" });

    const hashedInput = md5Hash(password);

    if (hashedInput !== user.password) {
      return res.status(401).json({ message: "Password Salah" });
    }

    const accessToken = jwt.sign(
      { regnum: user.regnum },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      { regnum: user.regnum },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      domain: "localhost",
      // secure: true,
      // sameSite: "strict",
    });

    res.json({ accessToken, user: { username: user.nama } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
