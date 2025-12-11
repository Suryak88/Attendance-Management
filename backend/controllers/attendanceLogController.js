import dbAbsensi from "../config/dbAbsensi.js";

export async function getLog(req, res) {
  const regnum = req.user.regnum;
  const { startDate, endDate } = req.query;

  try {
    const [rows] = await dbAbsensi.query("CALL khabsensi_user(?, ?, ?, ?)", [
      regnum,
      startDate,
      endDate,
      0,
    ]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
