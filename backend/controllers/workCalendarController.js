import dbAbsensi from "../config/dbAbsensi.js";

export async function fetchHoliday(req, res) {
  const { month } = req.params;

  // const [year, monthNumber] = month.split("-").map(Number);
  // const firstdate = new Date(year, monthNumber - 1, 1);
  // const lastdate = new Date(year, monthNumber, 0);
  try {
    const [rows] = await dbAbsensi.query(
      `SELECT * 
      FROM m_work_calendar 
      WHERE YEAR(work_date) = ? 
      AND is_workday = 0 `,
      [month],
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}
