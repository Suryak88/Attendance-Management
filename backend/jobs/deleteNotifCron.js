import cron from "node-cron";
import dbAbsensi from "../config/dbAbsensi.js";

export function deleteNotifCron() {
  cron.schedule(
    "0 1 1 * *",
    async () => {
      console.log("Running [Notif Cleanup]");

      let conn;

      try {
        conn = await dbAbsensi.getConnection();

        const [[cutoffResult]] = await conn.query(
          `SELECT DATE_FORMAT(
            CURDATE() - INTERVAL 3 MONTH,
            '%Y-%m-01'
          ) AS cutoff`,
        );

        const cutoff = cutoffResult.cutoff;

        const [result] = await conn.query(
          `
        DELETE FROM t_notification 
        WHERE created_at < ?
        `,
          [cutoff],
        );

        await conn.query(
          `INSERT INTO log_event (event_name, run_time, keterangan)
            VALUES (?, NOW(), ?)`,
          [
            "Notif_Cleanup_Success",
            `Deleted ${result.affectedRows} notifications before ${cutoff}`,
          ],
        );

        await conn.commit();

        console.log(
          `[Notif Cleanup] Deleted ${result.affectedRows} notifications before ${cutoff}`,
        );
      } catch (error) {
        if (conn) {
          try {
            await conn.rollback();
          } catch (rollbackError) {
            console.error("[Notif Cleanup] Rollback Failed: ", rollbackError);
          }
        }
        console.error("[Notif Cleanup] Failed:", error);

        try {
          await conn.query(
            `INSERT INTO log_event (event_name, run_time, keterangan)
                VALUES (?, NOW(), ?)`,
            ["Notif_Cleanup_Error", error.message],
          );
        } catch (logError) {
          console.error("[Notif Cleanup] failed to write error log", logError);
        }
      } finally {
        conn.release();
      }
    },
    {
      timezone: "Asia/Jakarta",
    },
  );
}
