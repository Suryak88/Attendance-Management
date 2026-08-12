import { formatDateIndo } from "./date.js";
import { formatCapitalize } from "./formatCapitalize.js";

export function buildLeaveHtml(template, leave) {
  if (!leave) {
    throw new Error("Leave tidak ditemukan");
  }

  let posisi;
  if (leave.departemen_id) {
    posisi = `${leave.jabatan}`;
  } else {
    posisi = `${leave.jabatan} - ${formatCapitalize(leave.departemen)}`;
  }

  return template
    .replace(/{{nama}}/g, leave.namalengkap)
    .replace(/{{jabatan}}/g, posisi)
    .replace(/{{alasan}}/g, leave.keterangan)
    .replace(/{{tgl1}}/g, formatDateIndo(leave.tgl1))
    .replace(/{{tgl2}}/g, formatDateIndo(leave.tgl2))
    .replace(/{{durasi}}/g, leave.duration)
    .replace(/{{pemohon}}/g, leave.namalengkap);
}
