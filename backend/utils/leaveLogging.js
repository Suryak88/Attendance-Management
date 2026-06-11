export async function leaveLogging(
  conn,
  { leaveId, action, description, actor },
) {
  await conn.query(
    `INSERT INTO t_leave_log (leave_id, action, description, actor)
        VALUES (?, ?, ?, ?)`,
    [leaveId, action, description, actor],
  );
}
