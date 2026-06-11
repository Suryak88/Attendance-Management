import cron from "node-cron";
import dbAbsensi from "../config/dbAbsensi.js";
import { formatLocalDate } from "../utils/date.js";

export function startOvertimeCron() {
  cron.schedule("23 1 * * *", async () => {
    console.log("Running overtime daily detection...");

    const conn = await dbAbsensi.getConnection();

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const start = formatLocalDate(startDate);
      const end = formatLocalDate(new Date());

      await conn.query(
        `INSERT INTO log_event (event_name, run_time, keterangan)
            VALUES (?, NOW(), ?)`,
        ["Deteksi_lembur_30d_start", `range start: ${start}`],
      );

      await conn.query(`CALL khdeteksi_lembur(?, ?, ?)`, [start, end, null]);

      await conn.query(
        `INSERT INTO log_event (event_name, run_time, keterangan)
            VALUES (?, NOW(), ?)`,
        ["Deteksi_lembur_30d_end", `range end: ${end}`],
      );

      console.log("Overtime detection finished");
    } catch (error) {
      console.error("Overtime detection with cron failed: ", error);

      try {
        await conn.query(
          `INSERT INTO log_event (event_name, run_time, keterangan)
                VALUES (?, NOW(), ?)`,
          ["Deteksi_lembur_30d_error", error.message],
        );
      } catch (error) {
        console.error("Failed to log overtime cron error:", error);
      }
    } finally {
      conn.release();
    }
  });
}
