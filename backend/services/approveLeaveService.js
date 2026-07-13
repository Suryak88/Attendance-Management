import { BusinessError } from "../errors/BusinessError.js";
import { buildLeaveDates } from "../utils/buildLeaveDates.js";
import { formatDateIndo, getDatesBetween } from "../utils/date.js";
import { validateRangeNotClosed } from "../utils/validateNotClosed.js";
import { authorityChecking } from "./authorityService.js";

export async function approveLeave(conn, leave, loginRegnum) {
  await authorityChecking(conn, leave.regnum, loginRegnum);
  await validateRangeNotClosed(conn, leave.regnum, leave.tgl1, leave.tgl2);

  const [workdays] = await conn.query(
    `SELECT work_date 
      FROM m_work_calendar 
      WHERE work_date BETWEEN ? AND ? 
      AND is_workday = 1`,
    [leave.tgl1, leave.tgl2],
  );

  // const leaveDates = workdays.map((w) => new Date(w.work_date));

  const [conflicts] = await conn.query(
    `SELECT asattenddate_rev 
       FROM t_absensi 
       WHERE regnum = ? 
       AND asattenddate_rev BETWEEN ? AND ? 
       AND checkdatetime_rev IS NOT NULL
       FOR UPDATE`,
    [leave.regnum, leave.tgl1, leave.tgl2],
  );

  if (conflicts.length > 0) {
    throw new BusinessError(
      "LEAVE_CONFLICT_ATTENDANCE",
      `Sudah terdapat absensi pada ${formatDateIndo(conflicts[0].asattenddate_rev)}`,
    );
  }

  const [[leaveTypeRow]] = await conn.query(
    `SELECT a.quota_type, a.default_quota, a.nama, a.day_type
		   FROM m_leave a
		   LEFT JOIN t_leave b
		   ON a.id = b.leave_id
		   WHERE b.id = ?`,
    [leave.id],
  );

  if (!leaveTypeRow) {
    throw new BusinessError("INVALID_LEAVE_TYPE", "Jenis cuti tidak valid");
  }

  const allLeaveDates = getDatesBetween(leave.tgl1, leave.tgl2);
  const leaveDates = buildLeaveDates(
    leaveTypeRow.day_type,
    workdays,
    allLeaveDates,
  );

  if (leaveTypeRow.quota_type === "BALANCE") {
    const [quotas] = await conn.query(
      `SELECT *
        FROM t_leave_quota
        WHERE regnum = ? 
        AND effective_date <= ?
        AND expired_at >= ?
        ORDER BY expired_at ASC FOR UPDATE`,
      [leave.regnum, leave.tgl1, leave.tgl1],
    );

    if (!quotas.length) {
      throw new BusinessError(
        "INSUFFICIENT_LEAVE_QUOTA",
        "Tidak terdapat jatah cuti tahunan",
      );
    }

    let quotaClone = quotas.map((q) => ({ ...q }));

    for (const date of leaveDates) {
      const q = quotaClone.find((x) => {
        const initialDate = new Date(x.effective_date);
        const lastDate = new Date(x.expired_at);
        return x.quota > 0 && date >= initialDate && date <= lastDate;
      });
      if (!q) {
        throw new BusinessError(
          "INSUFFICIENT_LEAVE_QUOTA",
          `Quota tidak mencukupi pada ${formatDateIndo(date)}`,
        );
      }

      await conn.query(
        `UPDATE t_leave_quota SET quota = quota - 1 WHERE id = ? AND quota > 0`,
        [q.id],
      );

      await conn.query(
        `INSERT INTO t_leave_usage
         (leave_request_id, leave_quota_id, leave_date, days)
         VALUES (?, ?, ?, 1)`,
        [leave.id, q.id, date],
      );

      q.quota -= 1;
    }
  } else if (leaveTypeRow.quota_type === "EVENT") {
    if (leaveDates.length > leaveTypeRow.default_quota) {
      throw new BusinessError(
        "INSUFFICIENT_EVENT_QUOTA",
        `Kuota ${leaveTypeRow.nama} hanya ${leaveTypeRow.default_quota} hari`,
      );
    }
  }

  await conn.query(
    `UPDATE t_leave set fl_approve = 1, approved_by = ?, approved_log = NOW() WHERE id = ?`,
    [loginRegnum, leave.id],
  );
}
