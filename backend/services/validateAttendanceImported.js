import { BusinessError } from "../errors/BusinessError.js";
import { getLastAttendanceImported } from "./getLastAttendanceImported.js";

export async function validateAttendanceImported(conn, tgl) {
  const importedUntill = await getLastAttendanceImported(conn);

  if (!importedUntill) {
    throw new BusinessError(
      "ATTENDANCE_IMPORT_STATUS_UNKNOWN",
      "Status import absensi belum tersedia",
    );
  }

  if (new Date(tgl) > new Date(importedUntill)) {
    throw new BusinessError(
      "ATTENDANCE_NOT_IMPORTED_YET",
      "Data absensi tanggal tersebut belum diimport",
    );
  }
}
