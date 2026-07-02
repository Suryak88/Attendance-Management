export async function getLastAttendanceImported(conn) {
  const [[row]] = await conn.query(`
        SELECT MAX(imported_until) AS imported_until
        FROM attendance_import_batch`);

  return row.imported_until;
}
