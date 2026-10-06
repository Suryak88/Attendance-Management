import dbAbsensi from "../config/dbAbsensi.js";
import { getLastAttendanceImported } from "../services/getLastAttendanceImported.js";
import {
  createBroadcastNotification,
  formatNotification,
} from "../services/Notification/notificationService.js";

export async function fetchNotification(req, res) {
  try {
    const regnum = req.user.regnum;

    const [rows] = await dbAbsensi.query(
      `SELECT * FROM t_notification 
        WHERE regnum = ? 
        ORDER BY created_at DESC
        LIMIT 20`,
      [regnum],
    );

    const notifications = rows.map((r) => {
      const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      return formatNotification({ ...r, data });
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

export async function markAsRead(req, res) {
  try {
    const regnum = req.user.regnum;
    const { id } = req.params;

    await dbAbsensi.query(
      `UPDATE t_notification
      SET is_read = 1, read_at = NOW()
      WHERE id = ? AND regnum = ?`,
      [id, regnum],
    );

    res.status(200).json({ message: "Notif Updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const regnum = req.user.regnum;

    await dbAbsensi.query(
      `UPDATE t_notification 
      SET is_read = 1, read_at = NOW()
      WHERE regnum = ? 
      AND is_read = 0`,
      [regnum],
    );

    return res.status(200).json({ message: "All Notif Marked as Read" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function createNotifUpdateDataPresensi(req, res) {
  const conn = await dbAbsensi.getConnection();
  let transactionStarted = false;

  try {
    const importedUntil = await getLastAttendanceImported(conn);

    const [[lastAnnouncement]] = await conn.query(
      `SELECT MAX(DATA->>'$.throughDate') AS lastAnnouncedDate
        FROM t_notification
        WHERE TYPE = 'ATTENDANCE_UPDATED'`,
    );

    const lastAnnouncedDate = lastAnnouncement.lastAnnouncedDate;

    if (lastAnnouncedDate && importedUntil <= lastAnnouncedDate) {
      return res.status(409).json({
        code: "ATTENDANCE_UPDATE_ALREADY_ANNOUNCED",
        message: "Data Presensi hingga tanggal tersebut sudah pernah diumumkan",
      });
    }

    await conn.beginTransaction();
    transactionStarted = true;

    await conn.query(
      `DELETE FROM t_notification 
        WHERE type = 'ATTENDANCE_UPDATED'
        AND data->>'$.throughDate' < ?`,
      [importedUntil],
    );

    await createBroadcastNotification(conn, {
      type: "ATTENDANCE_UPDATED",
      reference_type: "ATTENDANCE",
      data: {
        throughDate: importedUntil,
      },
    });

    await conn.commit();
    transactionStarted = false;
    res.status(201).json({ message: "Notification Sent!" });
  } catch (error) {
    if (transactionStarted) {
      await conn.rollback();
    }
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}
