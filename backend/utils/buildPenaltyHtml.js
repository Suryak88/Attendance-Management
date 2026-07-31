import { formatDateIndo, formatMySQLTime } from "./date.js";

export function buildPenaltyHtml(template, reports, startDate, endDate) {
  const data = reports
    .map((report, index) => {
      const rows = report.details
        .map((d, i) => {
          return `
                <tr>
                    <td class="border p-0.5 text-center">${formatDateIndo(d.date, "long")}</td>
                    <td class="border p-0.5 text-center">${formatMySQLTime(d.clockIn) || "-"}</td>
                    <td class="border p-0.5 text-center">${formatMySQLTime(d.clockOut) || "-"}</td>
                    <td class="border p-0.5 text-center">${d.violation}</td>
                    <td class="border p-0.5 text-center">${d.penalty.toLocaleString("id-ID")}</td>
                </tr>
                `;
        })
        .join("");

      return `
        <div class="my-7 w-full break-inside-avoid">
            <table class="w-full text-sm border border-collapse">
                <thead>
                    <tr>
                        <th colspan="5" class="border p-1">
                            <h3 class="font-medium">${report.fullname}</h3>
                        </th>
                    </tr>
                    <tr>
                        <th class="border p-1 font-normal">Tanggal</th>
                        <th class="border p-1 font-normal">Masuk</th>
                        <th class="border p-1 font-normal">Pulang</th>
                        <th class="border p-1 font-normal">Keterangan</th>
                        <th class="border p-1 font-normal">Denda</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="border p-1 font-medium text-center">Total</td>
                        <td class="border p-1 text-center font-medium">${report.total_penalty.toLocaleString("id-ID")}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        `;
    })
    .join("");

  return template
    .replace(/{{startPeriode}}/g, formatDateIndo(startDate))
    .replace(/{{endPeriode}}/g, formatDateIndo(endDate))
    .replace(/{{data}}/g, data);
}
