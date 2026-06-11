import dbAbsensi from "../config/dbAbsensi.js";
import { BusinessError } from "../errors/BusinessError.js";
import { processCloseAttendance } from "../services/attendanceService.js";

export async function submitCloseAttendance(req, res) {
  const conn = await dbAbsensi.getConnection();
  try {
    const loginRegnum = req.user.regnum;
    const { targetRegnum, period } = req.body;
    const month = new Date(period).getMonth() + 1;
    const year = new Date(period).getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    await conn.beginTransaction();

    let effectiveRegnum = loginRegnum;

    if (targetRegnum !== undefined && targetRegnum !== "") {
      effectiveRegnum = Number(targetRegnum);
    }

    if (effectiveRegnum !== loginRegnum && effectiveRegnum !== 0) {
      const [rows] = await conn.query(
        `SELECT 1 FROM reg_person WHERE regnum = ? AND approver = ?`,
        [effectiveRegnum, loginRegnum],
      );

      if (rows.length === 0)
        return res.status(403).json({ message: "Forbidden" });
    }

    // const [existing] = await conn.query(
    //   `SELECT 1 FROM t_attendance_close WHERE regnum = ? AND month = ? AND year = ?`,
    //   [effectiveRegnum, month, year],
    // );

    // if (existing.length > 0) {
    //   throw new BusinessError(
    //     "ALREADY_CLOSED",
    //     "Data absensi ini sudah diclose!",
    //   );
    // }

    // const [[logs]] = await conn.query("CALL khabsensi_user(?, ?, ?, ?, ?)", [
    //   loginRegnum,
    //   effectiveRegnum,
    //   startDate,
    //   endDate,
    //   0,
    // ]);

    // const result = logs.reduce(
    //   (acc, l) => {
    //     const status = l.final_status;

    //     if (l.is_workday === 1) {
    //       if (status === "CONFLICT") {
    //         acc.has_conflict = true;
    //       }

    //       if (status === "MISSING") {
    //         acc.has_missing = true;
    //       }
    //     }

    //     return acc;
    //   },
    //   {
    //     has_conflict: false,
    //     has_missing: false,
    //   },
    // );

    // if (result.has_conflict || result.has_missing) {
    //   throw new BusinessError(
    //     "CANNOT_CLOSE",
    //     "Masih terdapat conflict atau missing data",
    //   );
    // }

    // await conn.query(
    //   `INSERT INTO t_attendance_close (regnum, month, year, closed_by)
    //     VALUE (?, ?, ?, ?)`,
    //   [effectiveRegnum, month, year, loginRegnum],
    // );

    await processCloseAttendance(
      conn,
      loginRegnum,
      effectiveRegnum,
      month,
      year,
      { allowAbsent: true },
    );

    await conn.commit();
    return res.status(200).json({ message: "Attendance Report Closed!" });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}
