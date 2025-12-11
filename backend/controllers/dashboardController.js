import dbAbsensi from "../config/dbAbsensi.js";

export async function getPunctuality(req, res) {
  const regnum = req.user.regnum;
  const { startDate, endDate } = req.query;

  try {
    const [rows] = await dbAbsensi.query("CALL khabsensi_user(?, ?, ?, ?)", [
      regnum,
      startDate,
      endDate,
      1,
    ]);

    // const totalTelat = rows[0].reduce((sum, row) => sum + row.telat, 0);

    const dataRows = Array.isArray(rows[0]) ? rows[0] : [];
    const totalTelat = dataRows.reduce((sum, row) => sum + row.telat, 0);

    const hours = Math.floor(totalTelat / 60);
    const minutes = totalTelat % 60;
    const formattedLate =
      hours > 0 ? `${hours} hours ${minutes} minutes` : `${minutes} minutes`;

    res.json({ totalTelat, formattedLate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
