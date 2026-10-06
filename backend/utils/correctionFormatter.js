export function getCorrectionTypeLabel(type) {
  const labels = {
    ISI_ABSEN_MASUK: "Koreksi Masuk",
    ISI_ABSEN_PULANG: "Koreksi Pulang",
    ISI_ABSEN_MASUK_PULANG: "Koreksi Masuk & Pulang",
    IZIN_TELAT: "Izin Terlambat",
    IZIN_PULANG_CEPAT: "Izin Pulang Cepat",
    IZIN_TELAT_PULANG_CEPAT: "Izin Terlambat & Pulang Cepat",
  };

  return labels[type] ?? "Koreksi Absensi";
}
