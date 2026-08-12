import fs from "fs";
import path from "path";
import { formatDateIndo, formatMySQLTime } from "./date.js";
import { formatDailyStatus } from "./formatDailyStatus.js";
import { formatValue } from "./formatValueforPDF.js";
import { formatCapitalize } from "./formatCapitalize.js";

const logoPath = path.join(process.cwd(), "assets", "logo.png");
const logoBase64 = fs.readFileSync(logoPath, "base64");
const logoSrc = `data:image/png;base64,${logoBase64}`;

export function buildHTML(template, reports, period) {
  const periodDisplay = new Date(period).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });
  return reports
    .map((report) => {
      const rows = report.logs
        .map((l) => {
          if (l.is_workday === 0) {
            if (l.masuk || l.pulang) {
              return `
                    <tr>
                    <td class="border p-0.5 text-center">${formatDateIndo(l.asattenddate_rev, "long")}</td>
                    <td class="border p-0.5 text-center">${formatMySQLTime(l.masuk) || "-"}</td>
                    <td class="border p-0.5 text-center">${formatMySQLTime(l.pulang) || "-"}</td>
                    <td class="border p-0.5 text-center">${formatValue(l.telat, "menit")}${l.late_excused ? " (Izin)" : ""}</td>
                    <td class="border p-0.5 text-center">${formatValue(l.pulang_cepat, "menit")}${l.early_leave_excused ? " (Izin)" : ""} </td>
                    <td class="border p-0.5 text-center">${formatValue(l.durasi_lembur, "jam")}</td>
                    <td class="border p-0.5 text-center">${formatDailyStatus(l.final_status)}</td>
                    </tr>
                    `;
            }

            return `
                    <tr>
                        <td class="border p-0.5 text-center">
                            ${formatDateIndo(l.asattenddate_rev, "long")}
                        </td>
                        <td colspan="6" class="border p-0.5 text-center font-medium">
                            ${l.calendar_desc || "Libur"}
                        </td>
                    </tr>
                    `;
          }
          if (l.final_status === "CONFLICT") {
            return `
                <tr>
                <td class="border p-0.5 text-center">${formatDateIndo(l.asattenddate_rev, "long")}</td>
                <td class="border p-0.5 text-center">${formatMySQLTime(l.masuk) || "-"}</td>
                <td class="border p-0.5 text-center">${formatMySQLTime(l.pulang) || "-"}</td>  
                <td colspan="3" class="border p-0.5 text-center font-medium">
                    ${l.leave_name}
                </td>                          
                <td class="border p-0.5 text-center">${formatDailyStatus(l.final_status)}</td>                
            `;
          }
          if (l.attendance_status === 1) {
            return `
                    <tr>
                        <td class="border p-0.5 text-center">
                            ${formatDateIndo(l.asattenddate_rev, "long")}
                        </td>
                        <td colspan="6" class="border p-0.5 text-center font-medium">
                            ${l.leave_name || "Libur"}
                        </td>
                    </tr>
            `;
          }
          return `
                <tr>
                <td class="border p-0.5 text-center">${formatDateIndo(l.asattenddate_rev, "long")}</td>
                <td class="border p-0.5 text-center">${formatMySQLTime(l.masuk) || "-"}</td>
                <td class="border p-0.5 text-center">${formatMySQLTime(l.pulang) || "-"}</td>
                <td class="border p-0.5 text-center">${formatValue(l.telat, "menit")}${l.late_excused ? " (Izin)" : ""}</td>
                <td class="border p-0.5 text-center">${formatValue(l.pulang_cepat, "menit")}${l.early_leave_excused ? " (Izin)" : ""}</td>
                <td class="border p-0.5 text-center">${formatValue(l.durasi_lembur, "jam")}</td>
                <td class="border p-0.5 text-center">${formatDailyStatus(l.final_status)}</td>
                </tr>
            `;
        })
        .join("");

      const fixedItems = [
        {
          label: "Hadir",
          value: `${report.summary.present_days}/${report.summary.total_workdays}`,
          unit: "hari",
          priority: -3,
        },
        {
          label: "Jam Kerja",
          value: `${report.summary.total_actual_work_minutes.toLocaleString(
            "id-ID",
          )}/${report.summary.total_target_work_minutes.toLocaleString("id-ID")}`,
          unit: "menit",
          priority: -2,
        },
        {
          label: "Cuti",
          value: report.summary.leave_days,
          unit: "hari",
          priority: -1,
        },
      ];
      const summaryItems = [
        ...fixedItems,

        {
          label: "Sakit",
          value: report.summary.sick_days,
          unit: "hari",
          priority: 1,
        },
        {
          label: "Terlambat",
          value: report.summary.total_late_minutes_unexcused,
          unit: "menit",
          priority: 2,
        },
        {
          label: "Pulang lebih awal",
          value: report.summary.total_early_leave_minutes_unexcused,
          unit: "menit",
          priority: 3,
        },
        {
          label: "Lembur",
          value: report.summary.total_overtime_hours,
          unit: "jam",
          priority: 4,
        },
        {
          label: "Perhitungan lembur",
          value: report.summary.total_overtime_counted_hours,
          unit: "jam",
          priority: 5,
        },

        ...Object.entries(report.summary.leave_breakdown || {})
          .filter(([name]) => name !== "Cuti Tahunan" && name !== "Sakit")
          .map(([name, total]) => ({
            label: name,
            value: total,
            unit: "hari",
            priority: 100,
          })),
      ]
        .filter((x) => {
          if (x.priority < 0) return true;
          return Number(x.value) > 0;
        })
        .sort((a, b) => a.priority - b.priority);

      function renderColumn(items, labelWidth = "w-32") {
        return items
          .map((item) => {
            if (item.value === "") {
              return `
                  <div class="flex gap-2">
                    <p>${item.label}</p>
                  </div>
                `;
            }
            return `
              <div class="flex gap-2">
                <div class="${labelWidth} shrink-0">
                  <p>${item.label}</p>
                </div>
                <div>
                  <p>:</p>
                </div>
                <div>
                  <p>${item.value} ${item.unit}</p>
                </div>
              </div>
              `;
          })
          .join("");
      }

      const leftColumn = renderColumn(summaryItems.slice(0, 4), "w-18");

      const middleColumn = renderColumn(summaryItems.slice(4, 8), "w-35");

      const displayedOtherLeave = summaryItems.slice(8, 11);

      const remainingOtherLeave = summaryItems.slice(11);

      if (remainingOtherLeave.length > 0) {
        displayedOtherLeave.push({
          label: `+${remainingOtherLeave.length} jenis izin lainnya`,
          value: "",
          unit: "",
        });
      }

      const rightColumn = renderColumn(displayedOtherLeave, "w-40");

      return template
        .replace(/{{logo}}/g, logoSrc)
        .replace(/{{nama}}/g, report.employee.namalengkap)
        .replace(
          /{{departemen}}/g,
          formatCapitalize(report.employee.departemen),
        )
        .replace(/{{jabatan}}/g, report.employee.jabatan)
        .replace(/{{periode}}/g, periodDisplay)
        .replace(/{{status}}/g, report.status_header)
        .replace(/{{rows}}/g, rows)
        .replace(/{{total_workdays}}/g, report.summary.total_workdays)
        .replace(/{{present_days}}/g, report.summary.present_days)
        .replace(/{{cuti}}/g, report.summary.leave_days)
        .replace(/{{sakit}}/g, report.summary.sick_days)
        .replace(/{{total_izin}}/g, report.summary.total_leave_days)
        .replace(/{{terlambat}}/g, report.summary.total_late_minutes_unexcused)
        .replace(
          /{{pulang_cepat}}/g,
          report.summary.total_early_leave_minutes_unexcused,
        )
        .replace(/{{lembur}}/g, report.summary.total_overtime_hours)
        .replace(/{{jam_kerja}}/g, report.summary.total_actual_work_minutes)
        .replace(/{{jam_target}}/g, report.summary.total_target_work_minutes)
        .replace(/{{jam_lembur}}/g, report.summary.total_overtime_counted_hours)
        .replace(/{{left_column}}/g, leftColumn)
        .replace(/{{middle_column}}/g, middleColumn)
        .replace(/{{right_column}}/g, rightColumn);
    })
    .join("");
}
