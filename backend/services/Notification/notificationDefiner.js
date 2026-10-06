import { getCorrectionTypeLabel } from "../../utils/correctionFormatter.js";
import { formatDateIndo, formatDateRangeIndo } from "../../utils/date.js";
import { truncateText } from "../../utils/truncateText.js";

export const notificationDefinitions = {
  LEAVE_APPROVED: {
    title: (data) => `${data.leaveName} Disetujui`,
    message: (data) =>
      `Permohonan ${data.leaveName} tanggal ${formatDateRangeIndo(data.tgl1, data.tgl2)} telah disetujui `,
  },

  LEAVE_REJECTED: {
    title: (data) => `${data.leaveName} Ditolak`,
    message: (data) =>
      `Permohonan ${data.leaveName} tanggal ${formatDateRangeIndo(data.tgl1, data.tgl2)} telah ditolak `,
  },

  LEAVE_SUBMITTED: {
    title: (data) => `Pengajuan ${data.leaveName}`,
    message: (data) =>
      `${truncateText(data.employeeName)} mengajukan ${data.leaveName} untuk tanggal ${formatDateRangeIndo(data.tgl1, data.tgl2)}`,
  },

  LEAVE_REVOKED: {
    title: (data) => `Persetujuan ${data.leaveName} Dibatalkan`,
    message: (data) =>
      `Persetujuan ${data.leaveName} tanggal ${formatDateRangeIndo(data.tgl1, data.tgl2)} telah dibatalkan`,
  },

  LEAVE_REVISE_SUBMITTED: {
    title: (data) => `Pengajuan Revisi ${data.leaveName}`,
    message: (data) =>
      `${truncateText(data.employeeName)} mengajukan revisi ${data.leaveName} dari ${formatDateRangeIndo(data.tgl1, data.tgl2old)} menjadi ${formatDateRangeIndo(data.tgl1, data.tgl2new)}`,
  },

  LEAVE_REVISE_APPROVED: {
    title: (data) => `Revisi ${data.leaveName} Disetujui`,
    message: (data) =>
      `Permohonan revisi ${data.leaveName} dari ${formatDateRangeIndo(data.tgl1, data.tgl2old)} menjadi ${formatDateRangeIndo(data.tgl1, data.tgl2new)} telah disetujui`,
  },

  LEAVE_REVISE_REJECTED: {
    title: (data) => `Revisi ${data.leaveName} Ditolak`,
    message: (data) =>
      `Permohonan revisi ${data.leaveName} dari ${formatDateRangeIndo(data.tgl1, data.tgl2old)} menjadi ${formatDateRangeIndo(data.tgl1, data.tgl2new)} telah ditolak`,
  },

  CORRECTION_APPROVED: {
    title: (data) =>
      `${getCorrectionTypeLabel(data.correction_type)} Disetujui`,
    message: (data) =>
      `Permohonan ${getCorrectionTypeLabel(data.correction_type)} tanggal ${formatDateIndo(data.tgl)} telah disetujui `,
  },

  CORRECTION_REJECTED: {
    title: (data) => `${getCorrectionTypeLabel(data.correction_type)} Ditolak`,
    message: (data) =>
      `Permohonan ${getCorrectionTypeLabel(data.correction_type)} tanggal ${formatDateIndo(data.tgl)} telah ditolak `,
  },

  CORRECTION_SUBMITTED: {
    title: (data) =>
      `Pengajuan ${getCorrectionTypeLabel(data.correction_type)}`,
    message: (data) =>
      `${truncateText(data.employeeName)} mengajukan ${getCorrectionTypeLabel(data.correction_type)} untuk tanggal ${formatDateIndo(data.tgl)}`,
  },

  OVERTIME_APPROVED: {
    title: () => "Lembur Disetujui",
    message: (data) =>
      `Pengajuan Lembur tanggal ${formatDateIndo(data.tgl)} telah disetujui`,
  },

  OVERTIME_REJECTED: {
    title: () => "Lembur Ditolak",
    message: (data) =>
      `Pengajuan Lembur tanggal ${formatDateIndo(data.tgl)} telah ditolak`,
  },

  OVERTIME_SUBMITTED: {
    title: () => `Pengajuan Lembur`,
    message: (data) =>
      `${data.employeeName} mengajukan Lembur untuk tanggal ${formatDateIndo(data.tgl)}`,
  },

  ATTENDANCE_UPDATED: {
    title: () => `Data Presensi Diperbarui`,
    message: (data) =>
      `Data presensi sudah diperbarui hingga ${formatDateIndo(data.throughDate, "long")}`,
  },
};
