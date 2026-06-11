import { formatDateIndo } from "./date.js";

export function buildLeaveHtml(template, leave) {
  if (!leave) {
    throw new Error("Leave tidak ditemukan");
  }

  return template
    .replace(/{{nama}}/g, leave[0].leave.namalengkap)
    .replace(
      /{{jabatan}}/g,
      `${leave[0].leave.jabatan} - ${leave[0].leave.divisi}`,
    )
    .replace(/{{alasan}}/g, leave[0].leave.keterangan)
    .replace(/{{tgl1}}/g, formatDateIndo(leave[0].leave.tgl1))
    .replace(/{{tgl2}}/g, formatDateIndo(leave[0].leave.tgl2))
    .replace(/{{durasi}}/g, leave[0].duration)
    .replace(/{{pemohon}}/g, leave[0].leave.namalengkap);
}
