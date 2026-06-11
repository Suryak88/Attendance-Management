import cron from "node-cron";
import { processCloseAttendance } from "../services/attendanceService.js";
import dbAbsensi from "../config/dbAbsensi.js";

export function startAttendanceCron() {
  cron.schedule("0 0 5 * *", async () => {
    console.log("Running auto close attendance...");

    const conn = await dbAbsensi.getConnection();

    let month = null;
    let year = null;

    try {
      const now = new Date();

      const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      month = targetDate.getMonth() + 1;
      year = targetDate.getFullYear();

      console.log(`Auto closing for ${month}-${year}`);
      await conn.query(
        `INSERT INTO log_event (event_name, run_time, keterangan)
        VALUES (?, NOW(), ?)`,
        ["Auto Close Attendance Start", `${month} - ${year}`],
      );

      const [employees] = await conn.query(
        `SELECT regnum FROM reg_person WHERE is_overtime_enabled = 1`,
      );

      for (const emp of employees) {
        const trx = await dbAbsensi.getConnection();
        try {
          await trx.beginTransaction();

          const result = await processCloseAttendance(
            trx,
            8,
            emp.regnum,
            month,
            year,
            {
              allowAbsent: false,
            },
          );
          console.log(`Closed: ${emp.regnum}`);

          await trx.query(
            `INSERT INTO log_close_attendance (regnum, month, year, status, absent_count, missing_count, conflict_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              emp.regnum,
              month,
              year,
              "SUCCESS",
              result.absent_count,
              result.missing_count,
              result.conflict_count,
            ],
          );

          await trx.commit();
        } catch (err) {
          await trx.rollback();

          console.log(`Skip ${emp.regnum}: ${err.message}`);

          let reason = "UNKNOWN";
          let absent = 0;
          let missing = 0;
          let conflict = 0;
          if (err.message === "CANNOT_CLOSE") {
            reason = "Conflict or Missing data";
          } else if (err.message === "HAS_ABSENT") {
            reason = "Absent";
          } else if (err.message === "ALREADY_CLOSED") {
            reason = "Already Closed";
          }

          if (err.detail) {
            absent = err.detail.absent_count;
            missing = err.detail.missing_count;
            conflict = err.detail.conflict_count;
          }

          await conn.query(
            `INSERT INTO log_close_attendance (regnum, month, year, status, keterangan, absent_count, missing_count, conflict_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              emp.regnum,
              month,
              year,
              "FAILED",
              reason,
              absent,
              missing,
              conflict,
            ],
          );

          console.log(`Skip ${emp.regnum}: ${err.message}`);
        } finally {
          trx.release();
        }
      }
    } catch (err) {
      console.error("Auto close failed:", err);
    } finally {
      try {
        await conn.query(
          `INSERT INTO log_event (event_name, run_time, keterangan)
              VALUES (?, NOW(), ?)`,
          ["Auto Close Attendance Finish", `${month} - ${year}`],
        );
      } catch (error) {
        console.error("Failed to log finish event:", error);
      }
      conn.release();
    }
  });
}
