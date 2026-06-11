import { BusinessError } from "../errors/BusinessError.js";

export async function processCloseAttendance(
  conn,
  loginRegnum,
  effectiveRegnum,
  month,
  year,
  options = {},
) {
  const { allowAbsent = true } = options;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const [existing] = await conn.query(
    `SELECT 1 FROM t_attendance_close 
    WHERE regnum = ? 
    AND month = ? 
    AND year = ?`,
    [effectiveRegnum, month, year],
  );

  if (existing.length > 0) {
    throw new BusinessError("ALREADY_CLOSED", "Data absensi ini sudah closed");
  }

  const [[logs]] = await conn.query("CALL khabsensi_user(?, ?, ?, ?, ?)", [
    loginRegnum,
    effectiveRegnum,
    startDate,
    endDate,
    0,
  ]);

  //   let has_conflict = false;
  //   let has_missing = false;
  //   let has_absent = false;
  let conflict_count = 0;
  let missing_count = 0;
  let absent_count = 0;

  for (const l of logs) {
    if (l.is_workday === 1) {
      if (l.final_status === "CONFLICT") conflict_count++;
      if (l.final_status === "MISSING") missing_count++;
      if (l.final_status === "ABSENT") absent_count++;
    }
  }

  //   if (has_conflict || has_missing) {
  //     throw new Error("CANNOT_CLOSE");
  //   }

  //   if (!allowAbsent && has_absent) {
  //     throw new Error("HAS_ABSENT");
  //   }

  if (conflict_count > 0 || missing_count > 0) {
    const err = new BusinessError(
      "CANNOT_CLOSE",
      "Masih terdapat conflict atau missing data",
    );
    err.detail = { conflict_count, missing_count, absent_count };
    throw err;
  }

  if (!allowAbsent && absent_count > 0) {
    const err = new BusinessError("HAS_ABSENT", "Terdapat Absent!");
    err.detail = { conflict_count, missing_count, absent_count };
    throw err;
  }

  await conn.query(
    `INSERT INTO t_attendance_close (regnum, month, year, closed_by)
        VALUE (?, ?, ?, ?)`,
    [effectiveRegnum, month, year, loginRegnum],
  );

  return {
    conflict_count,
    missing_count,
    absent_count,
  };
}
