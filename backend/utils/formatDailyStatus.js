export function formatDailyStatus(status) {
  switch (status) {
    case "PRESENT":
      return "Hadir";
    case "ABSENT":
      return "Absen";
    case "LEAVE":
      return "Izin/Cuti";
    case "MISSING":
      return "Tidak Lengkap";
    case "CONFLICT":
      return "Konflik";
    default:
      return "-";
  }
}
