import { authorityChecking } from "./authorityService.js";
import { validateRangeNotClosed } from "../utils/validateNotClosed.js";
import { BusinessError } from "../errors/BusinessError.js";
import { validateAttendanceImported } from "./validateAttendanceImported.js";

export async function approveCorrection(
  conn,
  request,
  loginRegnum,
  clockIn,
  clockOut,
  lateExcused = false,
  earlyLeaveExcused = false,
) {
  await authorityChecking(conn, request.regnum, loginRegnum);
  await validateRangeNotClosed(conn, request.regnum, request.tgl, request.tgl);
  await validateAttendanceImported(conn, request.tgl);
  let finalLateExcused = 0;
  let finalEarlyLeaveExcused = 0;

  switch (request.correction_type) {
    case "IZIN_TELAT":
      finalLateExcused = 1;
      break;

    case "IZIN_PULANG_CEPAT":
      finalEarlyLeaveExcused = 1;
      break;

    case "IZIN_TELAT_PULANG_CEPAT":
      finalLateExcused = 1;
      finalEarlyLeaveExcused = 1;
      break;

    case "ISI_ABSEN_MASUK":
      finalLateExcused = lateExcused ? 1 : 0;
      await attendanceChecking(conn, request.regnum, request.tgl, 0);

      break;

    case "ISI_ABSEN_PULANG":
      finalEarlyLeaveExcused = earlyLeaveExcused ? 1 : 0;
      await attendanceChecking(conn, request.regnum, request.tgl, 1);

      break;

    case "ISI_ABSEN_MASUK_PULANG":
      finalLateExcused = lateExcused ? 1 : 0;
      finalEarlyLeaveExcused = earlyLeaveExcused ? 1 : 0;

      await attendanceChecking(conn, request.regnum, request.tgl, 0);
      await attendanceChecking(conn, request.regnum, request.tgl, 1);

      break;
  }

  let query = `UPDATE t_correction SET fl_approve = 1, approved_by = ?, approved_log = NOW()`;
  const params = [loginRegnum];

  const isClockInChanged = clockIn != null && clockIn !== request.masuk;
  const isClockOutChanged = clockOut != null && clockOut !== request.pulang;

  if (isClockInChanged) {
    query += `, masuk = ?`;
    params.push(clockIn);
  }
  if (isClockOutChanged) {
    query += `, pulang = ?`;
    params.push(clockOut);
  }

  query += `, late_excused = ?, early_leave_excused = ? WHERE id = ?`;
  params.push(finalLateExcused, finalEarlyLeaveExcused, request.id);

  await conn.query(query, params);

  if (isClockInChanged || isClockOutChanged) {
    await conn.query(
      `INSERT INTO t_correction_revision (t_correction_id, old_masuk, new_masuk, old_pulang, new_pulang, entry_by)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [
        request.id,
        request.masuk,
        clockIn,
        request.pulang,
        clockOut,
        loginRegnum,
      ],
    );
  }

  await conn.query(`CALL khdeteksi_lembur(?, ?, ?)`, [
    request.tgl,
    request.tgl,
    request.regnum,
  ]);
}

async function attendanceChecking(conn, regnum, date, checkCode) {
  const [[conflicts]] = await conn.query(
    `SELECT 1
    FROM t_absensi
    WHERE regnum = ?
    AND checkdatetime_rev IS NOT NULL
    AND asattenddate_rev = ? 
    AND checkcode_rev = ?`,
    [regnum, date, checkCode],
  );

  if (conflicts) {
    if (checkCode === 0) {
      throw new BusinessError("CLOCK_IN_EXISTS", "Absen masuk sudah tersedia");
    }

    throw new BusinessError("CLOCK_OUT_EXISTS", "Absen pulang sudah tersedia");
  }

  return conflicts;
}
