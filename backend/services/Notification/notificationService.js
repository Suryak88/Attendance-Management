import { notificationDefinitions } from "./notificationDefiner.js";

export async function createNotification(
  conn,
  { regnum, type, reference_type = null, reference_id = null, data = null },
) {
  await conn.query(
    `INSERT INTO t_notification (regnum, type, reference_type, reference_id, data)
        VALUES (?, ?, ?, ?, ?)`,
    [
      regnum,
      type,
      reference_type,
      reference_id,
      data ? JSON.stringify(data) : null,
    ],
  );
}

export function formatNotification(notification) {
  const definition = notificationDefinitions[notification.type];

  if (!definition) {
    return {
      ...notification,
      title: "Notifikasi",
      message: "Terdapat notifikasi baru",
    };
  }

  return {
    ...notification,
    title: definition.title(notification.data || {}),
    message: definition.message(notification.data || {}),
  };
}

export async function createBroadcastNotification(
  conn,
  { type, reference_type = null, reference_id = null, data = null },
) {
  await conn.query(
    `INSERT INTO t_notification (regnum, type, reference_type, reference_id, data)
      SELECT regnum, ?, ?, ?, ? 
      FROM reg_person 
      WHERE approver IS NOT NULL`,
    [type, reference_type, reference_id, data ? JSON.stringify(data) : null],
  );
}

export async function deleteNotification(
  conn,
  { type, reference_type = null, reference_id = null },
) {
  await conn.query(
    `DELETE FROM t_notification
      WHERE reference_type = ? 
        AND reference_id = ? 
        AND type = ?`,
    [reference_type, reference_id, type],
  );
}
