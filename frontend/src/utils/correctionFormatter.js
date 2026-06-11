import { formatMySQLTime, isoUTCToTime, minuteConvert } from "./Date";
import { truncateText } from "./truncateText";

export function enrichCorrection(item) {
  return {
    ...item,
    thumbnail: getThumbnail(item),
    lateFormatted: minuteConvert(item.telat),
    earlyLeaveFormatted: minuteConvert(item.pulang_cepat),
  };
}

function getThumbnail(item) {
  switch (item.correction_type) {
    case "ISI_ABSEN_MASUK":
      return {
        label: "Clock In",
        name: "Koreksi Masuk",
        value: isoUTCToTime(item.masuk),
        clockIn: isoUTCToTime(item.masuk),
      };
    case "ISI_ABSEN_PULANG":
      return {
        label: "Clock Out",
        name: "Koreksi Pulang",
        value: isoUTCToTime(item.pulang),
        clockOut: isoUTCToTime(item.pulang),
      };
    case "ISI_ABSEN_MASUK_PULANG":
      return {
        label: "Clock In & Out",
        name: "Koreksi Masuk & Pulang",
        value: `${isoUTCToTime(item.masuk)} & ${isoUTCToTime(item.pulang)}`,
        clockIn: isoUTCToTime(item.masuk),
        clockOut: isoUTCToTime(item.pulang),
      };
    // case "ISI_ABSEN_MASUK_PULANG":
    //   return {
    //     label: "Clock In & Out",
    //     name: "Koreksi Masuk & Pulang",
    //     clockIn: isoUTCToTime(item.masuk),
    //     clockOut: isoUTCToTime(item.pulang),
    //     isRange: true,
    //   };
    case "IZIN_TELAT":
      return {
        label: "Izin Terlambat",
        name: "Izin Terlambat",
        time: isoUTCToTime(item.masuk),
        value: truncateText(item.keterangan, 12),
      };
    case "IZIN_PULANG_CEPAT":
      return {
        label: "Izin Pulang Cepat",
        name: "Izin Pulang Cepat",
        time: formatMySQLTime(item.pulang),
        value: truncateText(item.keterangan, 12),
      };
    case "IZIN_TELAT_PULANG_CEPAT":
      return {
        label: "Izin Terlambat & Pulang Cepat",
        name: "Izin Terlambat & Pulang Cepat",
        value: `${formatMySQLTime(item.masuk)} & ${formatMySQLTime(item.pulang)}`,
      };
    default:
      return "-";
  }
}
