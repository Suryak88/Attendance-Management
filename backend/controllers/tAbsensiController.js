import dbAbsensi from "../config/dbAbsensi.js";
import { buildSummary } from "../utils/buildSummary.js";
import { buildHTML } from "../utils/buildHtml.js";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { BusinessError } from "../errors/BusinessError.js";
import { leaveLogging } from "../utils/leaveLogging.js";
import { formatLocalDate } from "../utils/date.js";
import { getBrowser } from "../services/pdfService.js";
import { runWithLimit } from "../services/concurrency.js";
import { authorityChecking } from "../services/authorityService.js";
import { buildLatePenalty } from "../utils/buildLatePenalty.js";
import { buildPenaltyHtml } from "../utils/buildPenaltyHtml.js";

export async function getLog(req, res) {
  const loginRegnum = req.user.regnum;
  const { startDate, endDate, targetRegnum, status } = req.query;

  let effectiveRegnum = loginRegnum;

  if (targetRegnum === "all") {
    effectiveRegnum = 0;
  } else if (targetRegnum !== undefined && targetRegnum !== "") {
    effectiveRegnum = Number(targetRegnum);
  }

  try {
    if (effectiveRegnum !== loginRegnum && effectiveRegnum !== 0) {
      const [rows] = await dbAbsensi.query(
        `SELECT 1 FROM reg_person WHERE regnum = ? AND approver = ?`,
        [effectiveRegnum, loginRegnum],
      );

      if (rows.length === 0)
        return res.status(403).json({ message: "Forbidden" });
    }

    const [logs] = await dbAbsensi.query("CALL khabsensi_user(?, ?, ?, ?, ?)", [
      loginRegnum,
      effectiveRegnum,
      startDate,
      endDate,
      status,
    ]);
    res.json(logs[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function showReport(req, res) {
  const loginRegnum = req.user.regnum;
  const { startDate, endDate, targetRegnum, status } = req.query;

  let effectiveRegnum = loginRegnum;

  if (targetRegnum === "all") {
    effectiveRegnum = 0;
  } else if (targetRegnum !== undefined && targetRegnum !== "") {
    effectiveRegnum = Number(targetRegnum);
  }

  try {
    if (effectiveRegnum !== loginRegnum && effectiveRegnum !== 0) {
      const [rows] = await dbAbsensi.query(
        `SELECT 1 FROM reg_person WHERE regnum = ? AND approver = ?`,
        [effectiveRegnum, loginRegnum],
      );

      if (rows.length === 0)
        return res.status(403).json({ message: "Forbidden" });
    }

    const [[logs]] = await dbAbsensi.query(
      "CALL khabsensi_user(?, ?, ?, ?, ?)",
      [loginRegnum, effectiveRegnum, startDate, endDate, status],
    );

    const [closedRows] = await dbAbsensi.query(
      `SELECT 1
      FROM t_attendance_close
      WHERE regnum = ? 
      AND month = ? 
      AND year = ?`,
      [
        targetRegnum,
        new Date(startDate).getMonth() + 1,
        new Date(startDate).getFullYear(),
      ],
    );
    const isClosed = closedRows.length > 0;
    const { summary, flags } = buildSummary(logs);

    res.json({
      logs,
      summary: summary,
      flags: {
        has_conflict: flags.has_conflict,
        has_missing: flags.has_missing,
        has_absent: flags.has_absent,
      },
      isClosed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function printAllReport(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const loginRegnum = req.user.regnum;
    const { targetRegnum, period, mode } = req.body;
    const month = new Date(period).getMonth() + 1;
    const year = new Date(period).getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    await conn.beginTransaction();
    let employeeList = [];
    const reports = [];

    if (mode === "all") {
      const [subordinates] = await conn.query(
        `SELECT regnum FROM reg_person 
            WHERE regnum = ? OR approver = ? 
            ORDER BY CASE WHEN regnum = ? THEN 0 ELSE 1 END, namalengkap`,
        [loginRegnum, loginRegnum, loginRegnum],
      );
      employeeList = subordinates.map((s) => s.regnum);
    } else if (mode === "single") {
      const [subordinate] = await conn.query(
        `SELECT regnum FROM reg_person
            WHERE regnum = ? AND approver = ?`,
        [targetRegnum, loginRegnum],
      );
      employeeList = subordinate.map((s) => s.regnum);
    } else if (mode === "selected") {
      const [subordinates] = await conn.query(
        `SELECT regnum FROM reg_person 
            WHERE regnum IN (?) AND (approver = ? OR regnum = ?)`,
        [targetRegnum, loginRegnum, loginRegnum],
      );
      employeeList = subordinates.map((s) => s.regnum);
    }

    for (const reg of employeeList) {
      const [[logs]] = await conn.query("CALL khabsensi_user(?, ?, ?, ?, ?)", [
        loginRegnum,
        reg,
        startDate,
        endDate,
        0,
      ]);

      const { summary, flags } = buildSummary(logs);

      const [[user]] = await conn.query(
        `SELECT * FROM reg_person 
        WHERE regnum = ?`,
        [reg],
      );

      reports.push({
        employee: {
          regnum: user.regnum,
          namalengkap: user.namalengkap,
          divisi: user.divisi,
          jabatan: user.jabatan,
        },
        logs,
        summary,
        flags,
      });
    }

    await conn.commit();
    res.json({ reports });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function generateReportPDF(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const loginRegnum = req.user.regnum;
    const { employees, period } = req.body;

    const month = new Date(period).getMonth() + 1;
    const year = new Date(period).getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const reports = [];
    const template = loadTemplate("attendance-report.html");

    for (const reg of employees) {
      const [[valid]] = await conn.query(
        `SELECT 1 FROM reg_person 
         WHERE regnum = ? AND (approver = ? OR regnum = ?)`,
        [reg, loginRegnum, loginRegnum],
      );

      if (!valid) continue;

      const [[logs]] = await conn.query("CALL khabsensi_user(?, ?, ?, ?, ?)", [
        loginRegnum,
        reg,
        startDate,
        endDate,
        0,
      ]);

      const { summary, flags } = buildSummary(logs);

      function getStatusHeader(flags) {
        const statuses = [];

        if (flags.has_conflict) statuses.push("Data Konflik");
        if (flags.has_missing) statuses.push("Data Tidak Lengkap");
        if (flags.has_absent) statuses.push("Terdapat Absen");

        return statuses.length > 0 ? statuses.join(", ") : "Lengkap";
      }

      const status_header = getStatusHeader(flags);

      const [[user]] = await conn.query(
        `SELECT regnum, namalengkap, divisi, jabatan 
         FROM reg_person WHERE regnum = ?`,
        [reg],
      );

      reports.push({
        employee: user,
        logs,
        summary,
        flags,
        status_header,
      });
    }

    const html = buildHTML(template, reports, period);

    const result = await runWithLimit(async () => {
      const browser = await getBrowser();
      const page = await browser.newPage();

      try {
        await page.setContent(html, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });

        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "20px",
            bottom: "20px",
            left: "20px",
            right: "20px",
          },
        });

        return pdf;
      } finally {
        await page.close();
      }
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Attendance Report ${month} ${year}.pdf`,
    });

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

function loadTemplate(templateName) {
  const filePath = path.join(process.cwd(), "templates", templateName);
  return fs.readFileSync(filePath, "utf-8");
}

export async function submitSolveConflict(req, res) {
  const conn = await dbAbsensi.getConnection();
  try {
    const loginRegnum = req.user.regnum;
    const { targetRegnum, date, solution } = req.body;
    await conn.beginTransaction();

    if (targetRegnum !== loginRegnum) {
      const [rows] = await conn.query(
        `SELECT 1 FROM reg_person WHERE regnum = ? AND approver = ?`,
        [targetRegnum, loginRegnum],
      );

      if (rows.length === 0)
        return res.status(403).json({ message: "Forbidden" });
    }

    const [[[logs]]] = await conn.query("CALL khabsensi_user(?, ?, ?, ?, ?)", [
      loginRegnum,
      targetRegnum,
      date,
      date,
      0,
    ]);
    if (logs.final_status !== "CONFLICT") {
      throw new BusinessError("NOT_CONFLICT", "Data tidak konflik");
    }

    if (solution === "leave") {
      await conn.query(
        `UPDATE t_absensi 
        SET attendance_status = 1, 
        leave_request_id = ?, 
        is_active = CASE
                      WHEN checkdatetime IS NULL THEN 1
                      ELSE 0
                    END
        WHERE regnum = ? 
        AND asattenddate_rev = ? `,
        [logs.leave_request_id, targetRegnum, date],
      );
    } else if (solution === "attendance") {
      const [[leave]] = await conn.query(
        `SELECT * 
        FROM t_leave 
        WHERE id = ? AND regnum = ? FOR UPDATE`,
        [logs.leave_request_id, targetRegnum],
      );

      if (!leave)
        throw new BusinessError("DATA_NOT_FOUND", "Data tidak ditemukan");

      const [pendingLeaves] = await conn.query(
        `SELECT a.id
        FROM t_leave_revision a
        LEFT JOIN t_leave b ON a.t_leave_id = b.id 
        WHERE a.fl_approve = 0 
        AND b.regnum = ?
        AND b.tgl1 <= ?
	      AND b.tgl2 >= ?`,
        [targetRegnum, date, date],
      );

      if (pendingLeaves.length > 0 && !req.body.force) {
        return res.status(409).json({
          code: "PENDING_LEAVE_EXISTS",
          message: "Terdapat pengajuan revisi cuti pending pada tanggal ini",
        });
      }

      if (req.body.force) {
        await conn.query(
          `UPDATE t_leave_revision 
          SET fl_approve = 3, 
            rejection_notes = "Dibatalkan sebagai penyelesaian konflik data",
            approved_by = ?,
            approved_log = NOW()
          WHERE fl_approve = 0 
          AND id = ?`,
          [8, pendingLeaves[0].id],
        );
      }

      const [[type]] = await conn.query(
        `SELECT quota_type
        FROM m_leave a 
        LEFT JOIN t_leave b
        ON b.leave_id = a.id
        WHERE b.id = ?`,
        [logs.leave_request_id],
      );

      if (date === leave.tgl1 && date === leave.tgl2) {
        await conn.query(
          `UPDATE t_leave 
          SET fl_approve = 3,
          rejection_notes = ?,
          approved_by = ?,
          approved_log = NOW()
          WHERE id = ?`,
          [
            "Dibatalkan sebagai penyelesaian konflik data",
            "8",
            logs.leave_request_id,
          ],
        );

        await leaveLogging(conn, {
          leaveId: logs.leave_request_id,
          action: "CANCELLED",
          description: "Batal cuti sebagai penyelesaian konflik data",
          actor: "System",
        });
      } else if (date === leave.tgl1) {
        const startDate = new Date(leave.tgl1);
        startDate.setDate(startDate.getDate() + 1);

        await conn.query(
          `UPDATE t_leave 
            SET tgl1 = ?
            WHERE id = ?`,
          [startDate, logs.leave_request_id],
        );

        await conn.query(
          `INSERT INTO t_leave_revision (t_leave_id, old_tgl1, new_tgl1, reason, entry_by, fl_approve, approved_by, approved_log)
            VALUES(?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            leave.id,
            leave.tgl1,
            startDate,
            "Penyelesaian konflik data",
            "0",
            "1",
            "8",
          ],
        );

        await leaveLogging(conn, {
          leaveId: logs.leave_request_id,
          action: "REVISED",
          description: "Ubah tgl mulai cuti sebagai penyelesaian konflik data",
          actor: "System",
        });
      } else if (date === leave.tgl2) {
        const endDate = new Date(leave.tgl2);
        endDate.setDate(endDate.getDate() - 1);

        await conn.query(
          `UPDATE t_leave 
            SET tgl2 = ?
            WHERE id = ?`,
          [endDate, logs.leave_request_id],
        );

        await conn.query(
          `INSERT INTO t_leave_revision (t_leave_id, old_tgl2, new_tgl2, reason, entry_by, fl_approve, approved_by, approved_log)
            VALUES(?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            leave.id,
            leave.tgl2,
            endDate,
            "Penyelesaian konflik data",
            "0",
            "1",
            "8",
          ],
        );

        await leaveLogging(conn, {
          leaveId: logs.leave_request_id,
          action: "REVISED",
          description: "Ubah tgl akhir cuti sebagai penyelesaian konflik data",
          actor: "System",
        });
      } else if (date > leave.tgl1 && date < leave.tgl2) {
        const rightStart = new Date(date);
        rightStart.setDate(rightStart.getDate() + 1);
        const rightStartFormatted = formatLocalDate(rightStart);

        const leftEnd = new Date(date);
        leftEnd.setDate(leftEnd.getDate() - 1);

        await conn.query(
          `INSERT INTO t_leave_revision (t_leave_id, old_tgl2, new_tgl2, reason, entry_by, fl_approve, approved_by, approved_log)
            VALUES(?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            leave.id,
            leave.tgl2,
            leftEnd,
            "Penyelesaian konflik data",
            "0",
            "1",
            "8",
          ],
        );

        await conn.query(
          `UPDATE t_leave 
            SET tgl2 = ?
            WHERE id = ?`,
          [leftEnd, logs.leave_request_id],
        );

        const [{ insertId: newLeaveId }] = await conn.query(
          `
          INSERT INTO t_leave (regnum, fullname, tgl1, tgl2, leave_id, keterangan, entry_by, fl_approve, approved_by, approved_log, rejection_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
          [
            leave.regnum,
            leave.fullname,
            rightStart,
            leave.tgl2,
            leave.leave_id,
            leave.keterangan,
            "0",
            "1",
            "8",
            "Request dibuat otomatis oleh sistem sebagai penyelesaian konflik",
          ],
        );

        if (type.quota_type === "BALANCE") {
          await conn.query(
            `UPDATE t_leave_usage 
            SET leave_request_id = ?
            WHERE leave_request_id = ?
            AND leave_date >= ?`,
            [newLeaveId, logs.leave_request_id, rightStartFormatted],
          );
        }

        await conn.query(
          `UPDATE t_absensi 
          SET leave_request_id = ?
          WHERE regnum = ? 
          AND leave_request_id = ?
          AND asattenddate_rev >= ?`,
          [
            newLeaveId,
            targetRegnum,
            logs.leave_request_id,
            rightStartFormatted,
          ],
        );

        await leaveLogging(conn, {
          leaveId: logs.leave_request_id,
          action: "SPLIT",
          description: `Split cuti: ${leave.tgl1} - ${leave.tgl2} menjadi ${leave.tgl1} - ${formatLocalDate(leftEnd)} dan ${formatLocalDate(rightStart)} - ${leave.tgl2} (penyelesaian konflik)`,
          actor: "System",
        });
        await leaveLogging(conn, {
          leaveId: newLeaveId,
          action: "CREATED_FROM_SPLIT",
          description: "Cuti hasil split konflik",
          actor: "System",
        });
      }

      if (type.quota_type === "BALANCE") {
        const [[usage]] = await conn.query(
          `SELECT * 
          FROM t_leave_usage
          WHERE leave_request_id = ?
          AND leave_date = ? FOR UPDATE`,
          [logs.leave_request_id, date],
        );

        if (!usage)
          throw new BusinessError(
            "USAGE_NOT_FOUND",
            "data penggunaan cuti tidak ditemukan",
          );

        await conn.query(
          `UPDATE t_leave_quota
          SET quota = quota + 1
          WHERE id = ?`,
          [usage.leave_quota_id],
        );

        await conn.query(
          `UPDATE t_leave_usage 
          SET fl_hapus = 1
          WHERE id = ?`,
          [usage.id],
        );
      }

      await conn.query(
        `UPDATE t_absensi 
        SET is_active = CASE
                          WHEN checkdatetime IS NULL THEN 0
                          ELSE 1
                        END,
        attendance_status = 0,
        leave_request_id = NULL
        WHERE regnum = ? 
        AND asattenddate_rev = ?`,
        [targetRegnum, date],
      );
    }

    await conn.commit();
    return res.status(200).json({ message: "Conflict solved" });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function fetchCloseAttendanceStatus(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const loginRegnum = req.user.regnum;
    const { period, status, targetRegnum } = req.body;
    const month = new Date(period).getMonth() + 1;
    const year = new Date(period).getFullYear();
    await conn.beginTransaction();
    let effectiveRegnum = loginRegnum;

    if (targetRegnum !== undefined && targetRegnum !== "") {
      effectiveRegnum = Number(targetRegnum);
    }

    if (effectiveRegnum !== loginRegnum && effectiveRegnum !== 0) {
      const [rows] = await conn.query(
        `SELECT 1 FROM reg_person WHERE regnum = ? AND approver = ?`,
        [effectiveRegnum, loginRegnum],
      );

      if (rows.length === 0)
        return res.status(403).json({ message: "Forbidden" });
    }

    let query = `
    SELECT
      p.regnum,
      p.namalengkap,
      tc.id AS closed_id,
      cb.namalengkap AS closed_by,
      l.status,
      l.absent_count,
      l.missing_count,
      l.conflict_count
    FROM
      reg_person p 
      LEFT JOIN t_attendance_close tc
        ON tc.regnum = p.regnum
        AND tc.month = ?
        AND tc.year = ?
      LEFT JOIN reg_person cb
        ON tc.closed_by = cb.regnum
      LEFT JOIN
        (SELECT
          l1.*
        FROM
          log_close_attendance l1
          JOIN
            (SELECT
              regnum,
              MAX(LOG) AS max_log
            FROM
              log_close_attendance
            WHERE MONTH = ?
              AND YEAR = ?
            GROUP BY regnum) l2
            ON l1.regnum = l2.regnum
            AND l1.log = l2.max_log) l
        ON l.regnum = p.regnum
    WHERE p.approver = ? OR p.regnum = ?
    ORDER BY 
        CASE WHEN p.regnum = ? THEN 0 ELSE 1 END,
        p.namalengkap;`;

    const params = [
      month,
      year,
      month,
      year,
      loginRegnum,
      loginRegnum,
      loginRegnum,
    ];

    if (status === "SUCCESS" || status === "FAILED") {
      query += ` AND a.status = ? `;
      params.push(status);
    }

    const [data] = await conn.query(query, params);

    const result = data.map((r) => {
      if (r.closed_id) {
        return {
          regnum: r.regnum,
          namalengkap: r.namalengkap,
          status: "SUCCESS",
          absent_count: 0,
          missing_count: 0,
          conflict_count: 0,
        };
      }

      if (r.status === "FAILED") {
        return {
          regnum: r.regnum,
          namalengkap: r.namalengkap,
          status: "FAILED",
          absent_count: r.absent_count,
          missing_count: r.missing_count,
          conflict_count: r.conflict_count,
        };
      }

      return {
        regnum: r.regnum,
        namalengkap: r.namalengkap,
        status: "OPEN",
      };
    });

    await conn.commit();
    res.json(result);
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function showLatePenalty(req, res) {
  const conn = await dbAbsensi.getConnection();

  const loginRegnum = req.user.regnum;
  const { startDate, endDate, targetRegnum } = req.query;
  const spv = [];
  const penalty = [];
  let effectiveRegnum = loginRegnum;

  if (targetRegnum === "all") {
    effectiveRegnum = 0;
  } else if (targetRegnum !== undefined && targetRegnum !== "") {
    effectiveRegnum = Number(targetRegnum);
  }

  try {
    if (effectiveRegnum !== loginRegnum && effectiveRegnum !== 0) {
      await authorityChecking(conn, targetRegnum, loginRegnum);
    }

    const [[isAdmin]] = await conn.query(
      `SELECT is_penalty_admin, floor_id 
      FROM reg_person 
      WHERE regnum = ?`,
      [loginRegnum],
    );

    if (isAdmin.is_penalty_admin === 1) {
      const [approvers] = await conn.query(
        `SELECT DISTINCT approver FROM reg_person WHERE floor_id = ? AND approver IS NOT NULL`,
        [isAdmin.floor_id],
      );

      const logsPerSupervisor = await Promise.all(
        approvers.map(async ({ approver }) => {
          const [[logs]] = await conn.query(
            "CALL khabsensi_user(?, ?, ?, ?, ?)",
            [approver, effectiveRegnum, startDate, endDate, 0],
          );

          return logs;
        }),
      );

      penalty.push(...logsPerSupervisor.flat());
    } else {
      const [[logs]] = await conn.query("CALL khabsensi_user(?, ?, ?, ?, ?)", [
        loginRegnum,
        effectiveRegnum,
        startDate,
        endDate,
        0,
      ]);
      penalty.push(...logs);
    }

    const [rules] = await conn.query("SELECT * FROM m_attendance_penalty");

    const result = buildLatePenalty(penalty, rules);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function generatePenaltyPDF(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const loginRegnum = req.user.regnum;
    const { employees, startDate, endDate } = req.body;

    const reports = [];
    const template = loadTemplate("attendance-penalty.html");

    const [[isAdmin]] = await conn.query(
      `SELECT is_penalty_admin
      FROM reg_person 
      WHERE regnum = ?`,
      [loginRegnum],
    );

    for (const reg of employees) {
      if (isAdmin === 0) {
        const [[valid]] = await conn.query(
          `SELECT 1 FROM reg_person
          WHERE regnum = ? AND (approver = ? OR regnum = ?)`,
          [reg, loginRegnum, loginRegnum],
        );

        if (!valid) continue;
      }

      const [[logs]] = await conn.query("CALL khabsensi_user(?, ?, ?, ?, ?)", [
        loginRegnum,
        reg,
        startDate,
        endDate,
        0,
      ]);

      const [rules] = await conn.query("SELECT * FROM m_attendance_penalty");

      const penalty = buildLatePenalty(logs, rules);

      reports.push(...penalty.summary);
    }

    const html = buildPenaltyHtml(template, reports, startDate, endDate);

    const result = await runWithLimit(async () => {
      const browser = await getBrowser();
      const page = await browser.newPage();

      try {
        await page.setContent(html, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });

        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "20px",
            bottom: "20px",
            left: "20px",
            right: "20px",
          },
        });

        return pdf;
      } finally {
        await page.close();
      }
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Penalty ${startDate}-${endDate}.pdf`,
    });

    res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

// untuk hrd agar bisa buka semua karyawan lt 6
export async function getEmployeeHRD(req, res) {
  try {
    const loginRegnum = req.user.regnum;

    const [[isAdmin]] = await dbAbsensi.query(
      `SELECT is_penalty_admin FROM reg_person WHERE regnum = ?`,
      [loginRegnum],
    );

    if (!isAdmin) {
      throw new BusinessError("FORBIDDEN", "FORBIDDEN");
    }

    const [employee] = await dbAbsensi.query(
      `SELECT * FROM reg_person WHERE approver = 211 OR approver = 11 ORDER BY namalengkap`,
    );

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
