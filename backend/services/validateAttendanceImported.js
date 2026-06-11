import { BusinessError } from "../errors/BusinessError.js";

export async function validateAttendanceImported(conn, tgl) {
  const [[dataSynced]] = await conn.query(
    `SELECT MAX(imported_until) AS lastSynced 
    FROM attendance_import_batch`,
  );

  if (!dataSynced.lastSynced) {
    throw new BusinessError(
      "ATTENDANCE_IMPORT_STATUS_UNKNOWN",
      "Status import absensi belum tersedia",
    );
  }

  if (tgl > dataSynced.lastSynced) {
    throw new BusinessError(
      "ATTENDANCE_NOT_IMPORTED_YET",
      "Data absensi tanggal tersebut belum diimport",
    );
  }
}
