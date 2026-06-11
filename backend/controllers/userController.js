import jwt from "jsonwebtoken";
import crypto from "crypto";
import dbAbsensi from "../config/dbAbsensi.js";
import bcrypt from "bcrypt";

function md5Hash(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function loginUser(req, res) {
  const { username, password } = req.body;
  try {
    const [rows] = await dbAbsensi.query(
      "SELECT * FROM m_users WHERE card_id = ?",
      [username],
    );
    const user = rows[0];

    if (!user) return res.status(404).json({ message: "User Not Found" });

    let isValid = false;

    if (user.password.startsWith("$2b$")) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      const hashedInput = md5Hash(password);
      isValid = hashedInput === user.password;

      if (isValid) {
        const bcryptHash = await bcrypt.hash(password, 10);

        await dbAbsensi.query(`UPDATE m_users SET password = ? WHERE id = ?`, [
          bcryptHash,
          user.id,
        ]);
      }
    }

    if (!isValid) {
      return res.status(401).json({ message: "Password Salah" });
    }

    const [[data]] = await dbAbsensi.query(
      "SELECT namalengkap, role FROM reg_person WHERE regnum = ?",
      [user.regnum],
    );

    const accessToken = jwt.sign(
      { regnum: user.regnum, role: data.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = jwt.sign(
      { regnum: user.regnum, role: data.role },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      // domain: "localhost",
      // secure: true,
      // sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        username: user.nama,
        fullname: data.namalengkap,
        regnum: user.regnum,
        role: data.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function changePassword(req, res) {
  const regnum = req.user.regnum;
  const { curPassword, newPassword } = req.body;

  try {
    const [[user]] = await dbAbsensi.query(
      `SELECT * FROM m_users WHERE regnum = ?`,
      [regnum],
    );

    if (!user) return res.status(404).json({ message: "User Not Found" });

    const isValid = await bcrypt.compare(curPassword, user.password);

    if (!isValid) return res.status(401).json({ message: "Password Salah" });

    const bcryptHash = await bcrypt.hash(newPassword, 10);

    await dbAbsensi.query(
      `UPDATE m_users 
      SET password = ? 
      WHERE id = ?`,
      [bcryptHash, user.id],
    );

    return res.status(200).json({ message: "Password Changed!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
