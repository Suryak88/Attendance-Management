import { BusinessError } from "../errors/BusinessError.js";

export async function validateRangeNotClosed(conn, regnum, startDate, endDate) {
  const [closed] = await conn.query(
    `SELECT 1 
     FROM t_attendance_close
     WHERE regnum = ?
     AND DATE(CONCAT(year, '-', LPAD(month,2,'0'), '-01')) <= ?
     AND LAST_DAY(CONCAT(year, '-', LPAD(month,2,'0'), '-01')) >= ?
     LIMIT 1`,
    [regnum, endDate, startDate],
  );

  if (closed.length > 0) {
    throw new BusinessError(
      "DATA_CLOSED",
      "Periode sudah diclose, tidak dapat diubah",
    );
  }
}

export async function validateDatesNotClosed(conn, regnum, dates) {
  if (!dates.length) return;

  const periods = new Set();

  for (const d of dates) {
    const date = new Date(d);
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    periods.add(`${y}-${m}`);
  }

  const conditions = Array.from(periods)
    .map(() => "(month = ? AND year = ?)")
    .join(" OR ");

  const params = Array.from(periods).flatMap((p) => {
    const [y, m] = p.split("-");
    return [Number(m), Number(y)];
  });

  const [rows] = await conn.query(
    `SELECT 1 FROM t_attendance_close
     WHERE regnum = ?
     AND (${conditions})`,
    [regnum, ...params],
  );

  if (rows.length > 0) {
    throw new BusinessError(
      "DATA_CLOSED",
      "Sebagian tanggal sudah diclose, tidak bisa diubah",
    );
  }
}
