import {
  formatDateIndo,
  formatLocalDate,
  getDatesBetween,
  toDateOnly,
} from "../utils/date.js";
import dbAbsensi from "../config/dbAbsensi.js";
import { BusinessError } from "../errors/BusinessError.js";
import {
  validateDatesNotClosed,
  validateRangeNotClosed,
} from "../utils/validateNotClosed.js";
import { buildLeaveHtml } from "../utils/buildLeaveHtml.js";
import path from "path";
import puppeteer from "puppeteer";
import fs from "fs";
import { getBrowser } from "../services/pdfService.js";
import { runWithLimit } from "../services/concurrency.js";
import { authorityChecking } from "../services/authorityService.js";
import { approveLeave } from "../services/approveLeaveService.js";
import { buildLeaveDates } from "../utils/buildLeaveDates.js";

export async function showLeaveQuota(req, res) {
  try {
    const loginRegnum = req.user.regnum;
    const { targetRegnum, date } = req.query;
    const month = new Date(date).getMonth();
    const year = new Date(date).getFullYear();
    let targetDate = new Date();
    if (date !== undefined && date !== "")
      targetDate = new Date(year, month + 1, 0);
    let effectiveRegnum = loginRegnum;
    if (targetRegnum !== undefined && targetRegnum !== "") {
      effectiveRegnum = Number(targetRegnum);
    }

    if (effectiveRegnum !== loginRegnum) {
      const [rows] = await dbAbsensi.query(
        `SELECT 1 FROM reg_person WHERE regnum = ? AND approver = ?`,
        [effectiveRegnum, loginRegnum],
      );

      if (rows.length === 0)
        return res.status(403).json({ message: "Forbidden" });
    }

    const [rows] = await dbAbsensi.query(
      `SELECT * FROM t_leave_quota 
      WHERE regnum = ? 
      AND effective_date <= ?
      AND expired_at >= ?`,
      [effectiveRegnum, toDateOnly(targetDate), toDateOnly(targetDate)],
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function showLeaveReqHistory(req, res) {
  try {
    const regnum = req.user.regnum;

    const [history] = await dbAbsensi.query(
      `SELECT
        a.*,
        b.nama AS leavename,
        c.namalengkap AS approver,
        r.old_tgl1, 
        r.new_tgl1,
        r.old_tgl2,
        r.new_tgl2,
        r.fl_approve AS revision_status,
        r.reason AS revision_reason,
        r.log_date AS revision_log,
        COALESCE(r.log_date, a.log_date) AS sort_date
      FROM
        t_leave a
        LEFT JOIN m_leave b ON a.leave_id = b.id
        LEFT JOIN reg_person c ON a.approved_by = c.regnum
        LEFT JOIN
          (SELECT r1.*
          FROM t_leave_revision r1
            JOIN
              (SELECT
                t_leave_id,
                MAX(id) AS max_id
              FROM
                t_leave_revision
              WHERE fl_hapus = 0
              GROUP BY t_leave_id) r2
              ON r1.id = r2.max_id) r
          ON r.t_leave_id = a.id
      WHERE a.regnum = ?
      ORDER BY sort_date DESC`,
      [regnum],
    );

    res.json(history);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function addLeaveRequest(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { name, startDate, endDate, leaveType, description } = req.body;
    const medicalCertificate = req.file;
    let relativePath = null;

    if (medicalCertificate) {
      relativePath = path
        .relative("uploads/medicalCertificate", req.file.path)
        .replace(/\\/g, "/");
    }

    const regnum = req.user.regnum;
    await conn.beginTransaction();

    await validateRangeNotClosed(conn, regnum, startDate, endDate);

    const allLeaveDates = getDatesBetween(startDate, endDate);
    const [calendarRows] = await conn.query(
      `SELECT work_date, is_workday
      FROM m_work_calendar 
      WHERE work_date IN (?)`,
      [allLeaveDates],
    );

    const calendarDates = new Set(calendarRows.map((c) => c.work_date));
    const missingDates = allLeaveDates.filter((d) => !calendarDates.has(d));
    if (missingDates.length > 0) {
      throw new BusinessError(
        "CALENDAR_NOT_FOUND",
        `Kalender kerja belum lengkap untuk tanggal: ${missingDates.join(", ")}`,
      );
    }

    const workdays = calendarRows
      .filter((d) => d.is_workday === 1)
      .map((d) => d.work_date);
    if (startDate === endDate && workdays.length === 0) {
      throw new BusinessError("HOLIDAY_DATE", "Tanggal merupakan hari libur");
    }
    if (workdays.length === 0) {
      throw new BusinessError(
        "NO_WORKDAY",
        "Rentang tanggal tidak ada hari kerja",
      );
    }

    const [conflicts] = await conn.query(
      `SELECT asattenddate_rev FROM t_absensi WHERE regnum = ? 
      AND asattenddate_rev BETWEEN ? AND ? 
      AND checkdatetime_rev IS NOT NULL`,
      [regnum, startDate, endDate],
    );

    if (conflicts.length > 0) {
      const first = conflicts[0];
      throw new BusinessError(
        "LEAVE_CONFLICT_ATTENDANCE",
        `Sudah terdapat absensi pada ${formatDateIndo(first.asattenddate_rev)}`,
      );
    }

    const [[overlap]] = await conn.query(
      `SELECT COUNT(*) AS total
         FROM t_leave
         WHERE regnum = ?
           AND fl_hapus = 0
           AND fl_approve IN (0,1)
           AND (
             tgl1 BETWEEN ? AND ?
             OR tgl2 BETWEEN ? AND ?
             OR (? BETWEEN tgl1 AND tgl2)
           )`,
      [regnum, startDate, endDate, startDate, endDate, startDate],
    );

    if (overlap.total > 0) {
      throw new BusinessError(
        "DUPLICATE_LEAVE",
        "Sudah terdapat request pada rentang tanggal ini",
      );
    }

    const [[leaveTypeRow]] = await conn.query(
      `SELECT quota_type, default_quota, nama, day_type FROM m_leave WHERE id = ?`,
      [leaveType],
    );

    if (leaveType === 1 && !medicalCertificate) {
      throw new BusinessError("NO_ATTACHMENT", "File surat sakit tidak ada!");
    }

    if (!leaveTypeRow) {
      throw new BusinessError("INVALID_LEAVE_TYPE", "Jenis cuti tidak valid");
    }

    // let leaveDates = [];

    // if (leaveTypeRow.day_type === "WORKDAY") {
    //   leaveDates = workdays.map((w) => new Date(w));
    // } else {
    //   leaveDates = allLeaveDates.map((d) => new Date(d));
    // }
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
        [regnum, startDate, startDate],
      );

      if (!quotas.length) {
        throw new BusinessError(
          "INSUFFICIENT_LEAVE_QUOTA",
          "Anda tidak memiliki jatah cuti tahunan",
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
            `Sisa cuti tahunan tidak mencukupi pada ${formatDateIndo(date)}`,
          );
        }
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
      `INSERT INTO t_leave 
      (regnum, fullname, tgl1, tgl2, leave_id, keterangan, entry_by, medical_certificate_name, medical_certificate_original_name, medical_certificate_mime) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        regnum,
        name,
        startDate,
        endDate,
        leaveType,
        description,
        regnum,
        relativePath,
        medicalCertificate?.originalname ?? null,
        medicalCertificate?.mimetype ?? null,
      ],
    );

    await conn.commit();

    res.status(201).json({
      message: "Form sent!",
    });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Failed deleting uploaded file", err);
        }
      });
    }

    if (error instanceof BusinessError) {
      return res.status(422).json({
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan pada server",
    });
  } finally {
    conn.release();
  }
}

export async function showLeaveRequest(req, res) {
  try {
    const regnum = req.user.regnum;
    const { startDate, endDate, status, targetRegnum } = req.query;

    let query = `SELECT a.*, DATE(a.tgl1) AS tglmulai, DATE(a.tgl2) AS tglakhir, c.nama AS "leaveName", b.namalengkap, b.divisi, b.jabatan, 
        CASE WHEN a.fl_approve = 0 THEN 'Pending' 
        WHEN a.fl_approve = 1 THEN 'Approved'
        ELSE 'Rejected' END AS "status",
        r.id AS revision_id,
        r.old_tgl2,
        r.new_tgl2,
        r.fl_approve AS revision_status,
        r.reason AS revision_reason,
        r.log_date AS revision_log_date,
        r.rejection_notes AS revision_rejection_notes,
        COALESCE(r.log_date, a.log_date) AS sort_date
        FROM t_leave a
        LEFT JOIN reg_person b ON a.regnum = b.regnum 
        LEFT JOIN m_leave c ON a.leave_id = c.id
        LEFT JOIN
          (SELECT
            r1.*
          FROM
            t_leave_revision r1
            JOIN
              (SELECT
                t_leave_id,
                MAX(id) AS max_id
              FROM
                t_leave_revision
              WHERE fl_hapus = 0
              GROUP BY t_leave_id) r2
              ON r1.id = r2.max_id) r
          ON r.t_leave_id = a.id
        WHERE b.approver = ? 
        AND (
             tgl1 BETWEEN ? AND ?
             OR tgl2 BETWEEN ? AND ?
             OR (? BETWEEN tgl1 AND tgl2)
           )
        AND a.fl_approve <> 3`;

    const params = [regnum, startDate, endDate, startDate, endDate, startDate];

    if (targetRegnum) {
      query += " AND a.regnum = ?";
      params.push(targetRegnum);
    }

    // if (status !== "all") {
    //   query += " AND a.fl_approve = ?";
    //   params.push(status);
    // }
    if (status == 0) {
      query += `
        AND (
          a.fl_approve = 0
          OR r.fl_approve = 0
        )
      `;
    } else if (status == 1) {
      query += `
        AND (
          a.fl_approve = 1
          AND (r.fl_approve IS NULL OR r.fl_approve = 1)
        )
      `;
    } else if (status == 2) {
      query += `
        AND (
          a.fl_approve = 2
          OR r.fl_approve = 2
        )
      `;
    }

    query += " ORDER BY sort_date DESC";

    const [rows] = await dbAbsensi.query(query, params);

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function approveLeaveReq(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { id } = req.params;
    const regnum = req.user.regnum;

    await conn.beginTransaction();

    const [[leave]] = await conn.query(
      `SELECT * FROM t_leave WHERE id = ? AND fl_approve = 0 FOR UPDATE`,
      [id],
    );

    if (!leave) {
      throw new BusinessError("INVALID_REQUEST", "Request tidak valid");
    }

    await approveLeave(conn, leave, regnum);

    // await validateRangeNotClosed(conn, leave.regnum, leave.tgl1, leave.tgl2);

    // const [workdays] = await conn.query(
    //   `SELECT work_date
    //   FROM m_work_calendar
    //   WHERE work_date BETWEEN ? AND ?
    //   AND is_workday = 1`,
    //   [leave.tgl1, leave.tgl2],
    // );

    // const leaveDates = workdays.map((w) => new Date(w.work_date));

    // const [conflicts] = await conn.query(
    //   `SELECT asattenddate_rev
    //    FROM t_absensi
    //    WHERE regnum = ?
    //    AND asattenddate_rev BETWEEN ? AND ?
    //    AND checkdatetime_rev IS NOT NULL
    //    FOR UPDATE`,
    //   [leave.regnum, leave.tgl1, leave.tgl2],
    // );

    // if (conflicts.length > 0) {
    //   throw new BusinessError(
    //     "LEAVE_CONFLICT_ATTENDANCE",
    //     `Sudah terdapat absensi pada ${formatDateIndo(conflicts[0].asattenddate_rev)}`,
    //   );
    // }

    // const [[leaveTypeRow]] = await conn.query(
    //   `SELECT a.quota_type, a.default_quota, a.nama
    //    FROM m_leave a
    //    LEFT JOIN t_leave b
    //    ON a.id = b.leave_id
    //    WHERE b.id = ?`,
    //   [id],
    // );

    // if (!leaveTypeRow) {
    //   throw new BusinessError("INVALID_LEAVE_TYPE", "Jenis cuti tidak valid");
    // }

    // if (leaveTypeRow.quota_type === "BALANCE") {
    //   const [quotas] = await conn.query(
    //     `SELECT *
    //     FROM t_leave_quota
    //     WHERE regnum = ?
    //     AND effective_date <= ?
    //     AND expired_at >= ?
    //     ORDER BY expired_at ASC FOR UPDATE`,
    //     [leave.regnum, leave.tgl1, leave.tgl1],
    //   );

    //   if (!quotas.length) {
    //     throw new BusinessError(
    //       "INSUFFICIENT_LEAVE_QUOTA",
    //       "Tidak terdapat jatah cuti tahunan",
    //     );
    //   }

    //   let quotaClone = quotas.map((q) => ({ ...q }));

    //   for (const date of leaveDates) {
    //     const q = quotaClone.find((x) => {
    //       const initialDate = new Date(x.effective_date);
    //       const lastDate = new Date(x.expired_at);
    //       return x.quota > 0 && date >= initialDate && date <= lastDate;
    //     });
    //     if (!q) {
    //       throw new BusinessError(
    //         "INSUFFICIENT_LEAVE_QUOTA",
    //         `Quota tidak mencukupi pada ${formatDateIndo(date)}`,
    //       );
    //     }

    //     await conn.query(
    //       `UPDATE t_leave_quota SET quota = quota - 1 WHERE id = ? AND quota > 0`,
    //       [q.id],
    //     );

    //     await conn.query(
    //       `INSERT INTO t_leave_usage
    //      (leave_request_id, leave_quota_id, leave_date, days)
    //      VALUES (?, ?, ?, 1)`,
    //       [leave.id, q.id, date],
    //     );

    //     q.quota -= 1;
    //   }
    // }

    // await conn.query(
    //   `UPDATE t_leave set fl_approve = 1, approved_by = ?, approved_log = NOW() WHERE id = ?`,
    //   [regnum, id],
    // );

    await conn.commit();
    return res.status(200).json({ message: "Request approved!" });
  } catch (error) {
    await conn.rollback();
    console.error("APPROVE ERROR:", error);

    if (error instanceof BusinessError) {
      return res.status(422).json({
        code: error.code,
        message: error.message,
      });
    }

    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function rejectLeaveReq(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { id } = req.params;
    const { notes } = req.body;
    const regnum = req.user.regnum;

    await conn.beginTransaction();

    const [[leave]] = await conn.query(
      `SELECT id FROM t_leave WHERE id = ? AND fl_approve = 0 FOR UPDATE`,
      [id],
    );

    if (!leave) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Request sudah diproses atau dibatalkan",
      );
    }

    await conn.query(
      `UPDATE t_leave SET fl_approve = 2, rejection_notes = ?, approved_by = ?, approved_log = NOW() WHERE id = ?`,
      [notes, regnum, id],
    );

    await conn.commit();
    return res.status(200).json({ message: "Request rejected!" });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function cancelRequest(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { id } = req.params;
    const regnum = req.user.regnum;

    await conn.beginTransaction();

    const [[leave]] = await conn.query(
      `SELECT * FROM t_leave WHERE id = ? AND regnum = ? AND fl_approve = 0 FOR UPDATE`,
      [id, regnum],
    );

    if (!leave) {
      await conn.rollback();
      return res.status(409).json({
        message: "Request tidak ditemukan atau sudah diproses",
      });
    }

    const [result] = await conn.query(
      `UPDATE t_leave SET fl_approve = 3, approved_by = ?, approved_log = NOW() WHERE id = ? AND fl_approve = 0`,
      [regnum, id],
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "Request gagal dibatalkan (status sudah berubah)",
      });
    }

    await conn.commit();
    return res.status(200).json({ message: "Request cancelled!" });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function reviseRequest(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { id } = req.params;
    const { toDate, reason } = req.body;
    const regnum = req.user.regnum;

    await conn.beginTransaction();

    const [[leave]] = await conn.query(
      `SELECT * FROM t_leave WHERE id = ? AND fl_approve = 1 AND regnum = ?`,
      [id, regnum],
    );

    if (!leave) {
      throw new BusinessError("INVALID_REQUEST", "Request tidak valid");
    }
    if (toDate > leave.tgl2) {
      throw new BusinessError(
        "INVALID_DATE",
        "Tanggal melebihi rentang waktu cuti yang diajukan",
      );
    }
    if (toDate === leave.tgl2) {
      throw new BusinessError("INVALID_DATE", "Tidak ada perubahan tanggal");
    }
    if (toDate < leave.tgl1) {
      throw new BusinessError(
        "INVALID_DATE",
        "Tanggal tidak dapat kurang dari tanggal awal cuti",
      );
    }

    const startCancel = new Date(toDate);
    startCancel.setDate(startCancel.getDate() + 1);
    const cancelDates = getDatesBetween(
      formatLocalDate(startCancel),
      leave.tgl2,
    );

    if (cancelDates.length > 0) {
      await validateDatesNotClosed(conn, regnum, cancelDates);
    }

    const rangeStartDate = new Date(leave.tgl1);
    const today = new Date();
    rangeStartDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const selisihWaktu = (today - rangeStartDate) / (1000 * 60 * 60 * 24);
    if (selisihWaktu > 90) {
      throw new BusinessError("INVALID_DATE", "Cuti sudah lewat dari 1 bulan!");
    }

    const [[overlap]] = await conn.query(
      `SELECT COUNT(*) AS total
		   FROM t_leave_revision
		   WHERE t_leave_id = ? 
		   AND fl_hapus = 0
		   AND fl_approve IN (0,1)`,
      [id],
    );

    if (overlap.total > 0) {
      throw new BusinessError(
        "DUPLICATE_REQUEST",
        "Sudah terdapat pengajuan untuk tanggal ini",
      );
    }

    const [[conflict]] = await conn.query(
      `SELECT COUNT(*) AS total
		   FROM t_absensi 
		   WHERE regnum = ?
		   AND asattenddate_rev BETWEEN ? AND ?
       AND checkdatetime_rev IS NOT NULL`,
      [regnum, leave.tgl1, toDate],
    );

    if (conflict.total > 0) {
      throw new BusinessError(
        "DATA_CONFLICT",
        `Sudah terdapat absensi pada rentang waktu ini`,
      );
    }

    await conn.query(
      `INSERT INTO t_leave_revision (t_leave_id, old_tgl2, new_tgl2, reason, entry_by)
        VALUES(?, ?, ?, ?, ?)`,
      [id, leave.tgl2, toDate, reason, regnum],
    );

    await conn.commit();
    return res.status(201).json({ message: "Request submitted!" });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function rejectRevision(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { id } = req.params;
    const { notes } = req.body;
    const regnum = req.user.regnum;

    conn.beginTransaction();

    const [[revise]] = await conn.query(
      `SELECT id FROM t_leave_revision WHERE id = ? AND fl_approve = 0 FOR UPDATE`,
      [id],
    );

    if (!revise) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Request sudah diproses atau dibatalkan",
      );
    }

    await conn.query(
      `UPDATE t_leave_revision SET fl_approve = 2, rejection_notes = ?, approved_by = ?, approved_log = NOW() WHERE id = ?`,
      [notes, regnum, id],
    );

    await conn.commit();
    return res.status(200).json({ message: "Request rejected!" });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function approveRevision(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { id } = req.params;
    const regnum = req.user.regnum;

    await conn.beginTransaction();

    const [[revision]] = await conn.query(
      `SELECT * FROM t_leave_revision WHERE id = ? AND fl_approve = 0 FOR UPDATE`,
      [id],
    );

    if (!revision) {
      throw new BusinessError("INVALID_REQUEST", "Request revisi tidak valid");
    }

    const [[leave]] = await conn.query(
      `SELECT * FROM t_leave WHERE id = ? AND fl_approve = 1 FOR UPDATE`,
      [revision.t_leave_id],
    );

    if (!leave) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Request cuti tidak ditemukan",
      );
    }

    const startCancel = new Date(revision.new_tgl2);
    startCancel.setDate(startCancel.getDate() + 1);
    const cancelDates = getDatesBetween(
      formatLocalDate(startCancel),
      revision.old_tgl2,
    );
    await validateDatesNotClosed(conn, leave.regnum, cancelDates);

    const [[conflict]] = await conn.query(
      `SELECT COUNT(*) AS total
		   FROM t_absensi 
		   WHERE regnum = ?
		   AND asattenddate_rev BETWEEN ? AND ? 
       AND checkdatetime_rev IS NOT NULL`,
      [leave.regnum, leave.tgl1, revision.new_tgl2],
    );

    if (conflict.total > 0) {
      throw new BusinessError(
        "DATA_CONFLICT",
        `Sudah terdapat absensi pada rentang waktu yang diajukan`,
      );
    }

    const [[type]] = await conn.query(
      `SELECT quota_type FROM m_leave WHERE id = ?`,
      [leave.leave_id],
    );

    if (type.quota_type === "BALANCE") {
      const [calendarRows] = await conn.query(
        `SELECT *
        FROM m_work_calendar 
        WHERE work_date IN (?)`,
        [cancelDates],
      );

      if (calendarRows.length !== cancelDates.length) {
        throw new BusinessError(
          "CALENDAR_NOT_FOUND",
          "Data kalender kerja belum lengkap",
        );
      }

      const workdayDates = calendarRows
        .filter((d) => d.is_workday === 1)
        .map((d) => d.work_date);

      let usages = [];

      if (workdayDates.length > 0) {
        const [rows] = await conn.query(
          `SELECT * 
          FROM t_leave_usage
          WHERE leave_request_id = ?
          AND leave_date IN (?)
          FOR UPDATE`,
          [revision.t_leave_id, workdayDates],
        );
        usages = rows;
      }

      for (const u of usages) {
        await conn.query(
          `UPDATE t_leave_quota
          SET quota = quota + 1
          WHERE id = ?`,
          [u.leave_quota_id],
        );

        await conn.query(
          `UPDATE t_leave_usage
          SET fl_hapus = 1
          WHERE id = ?`,
          [u.id],
        );
      }
    }

    await conn.query(
      `UPDATE t_absensi
      SET attendance_status = 0, leave_request_id = NULL
      WHERE regnum = ? AND asattenddate_rev IN (?)`,
      [leave.regnum, cancelDates],
    );

    await conn.query(
      `UPDATE t_leave
      SET tgl2 = ?
      WHERE id = ?`,
      [revision.new_tgl2, revision.t_leave_id],
    );

    await conn.query(
      `UPDATE t_leave_revision
      SET fl_approve = 1, approved_by = ?, approved_log = NOW()
      WHERE id = ?`,
      [regnum, id],
    );

    await conn.commit();
    return res.status(200).json({ message: "Revision approved!" });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function showRevisionHistory(req, res) {
  try {
    const { id } = req.params;

    const [revision] = await dbAbsensi.query(
      `SELECT * 
      FROM t_leave_revision 
      WHERE t_leave_id = ? 
      AND id <> (
        SELECT MAX(id)
        FROM t_leave_revision
        WHERE t_leave_id = ?
      )
      ORDER BY id DESC`,
      [id, id],
    );

    res.json(revision);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

function loadTemplate() {
  const filePath = path.join(process.cwd(), "templates", "leave-request.html");
  return fs.readFileSync(filePath, "utf-8");
}

export async function generatePDF(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const loginRegnum = req.user.regnum;
    const { id } = req.params;
    const { targetRegnum } = req.body;
    const data = [];
    const template = loadTemplate();
    let effectiveRegnum = loginRegnum;
    if (targetRegnum !== undefined && targetRegnum !== "") {
      effectiveRegnum = Number(targetRegnum);
    }

    if (effectiveRegnum !== loginRegnum) {
      const [rows] = await dbAbsensi.query(
        `SELECT 1 FROM reg_person WHERE regnum = ? AND approver = ?`,
        [effectiveRegnum, loginRegnum],
      );

      if (rows.length === 0)
        return res.status(403).json({ message: "Forbidden" });
    }

    const [[leave]] = await conn.query(
      `SELECT a.*, c.nama AS leavename, c.need_quota, c.day_type, b.namalengkap, b.divisi, b.jabatan
      FROM t_leave a
      JOIN reg_person b
      ON a.regnum = b.regnum
      JOIN m_leave c 
      ON a.leave_id = c.id
      WHERE a.id = ? AND a.regnum = ?`,
      [id, effectiveRegnum],
    );
    let duration;
    const allLeaveDates = getDatesBetween(leave.tgl1, leave.tgl2);
    if (leave.day_type === "CALENDAR") {
      duration = allLeaveDates.length;
    } else {
      const [[calendarRows]] = await conn.query(
        `SELECT COUNT(*) AS total
          FROM m_work_calendar 
          WHERE work_date IN (?)
          AND is_workday = 1`,
        [allLeaveDates],
      );
      duration = calendarRows.total;
    }

    data.push({ leave, duration });
    const html = buildLeaveHtml(template, data);

    // const browser = await puppeteer.launch({
    //   headless: "new",
    // });
    const result = await runWithLimit(async () => {
      const browser = await getBrowser();
      const page = await browser.newPage();

      try {
        await page.setContent(html, {
          waitUntil: "networkidle0",
          tiemout: 30000,
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
      "Content-Disposition": `attachment; filename=Leave Request ${leave.fullname}.pdf`,
    });

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function revokeApproval(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const loginRegnum = req.user.regnum;
    const { id } = req.params;
    const { notes } = req.body;

    await conn.beginTransaction();

    const [[leave]] = await conn.query(
      `SELECT * FROM t_leave 
      WHERE id = ? 
      AND fl_approve = 1 
      FOR UPDATE`,
      [id],
    );

    if (!leave) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Request cuti tidak ditemukan",
      );
    }

    const [[authority]] = await conn.query(
      `SELECT 1 FROM reg_person 
      WHERE regnum = ? AND approver = ?`,
      [leave.regnum, loginRegnum],
    );

    if (!authority) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await validateRangeNotClosed(conn, leave.regnum, leave.tgl1, leave.tgl2);

    const [[type]] = await conn.query(
      `SELECT quota_type FROM m_leave WHERE id = ?`,
      [leave.leave_id],
    );

    if (type.quota_type === "BALANCE") {
      const [rows] = await conn.query(
        `SELECT * 
        FROM t_leave_usage 
        WHERE leave_request_id = ? 
        AND leave_date BETWEEN ? AND ?
        FOR UPDATE`,
        [id, leave.tgl1, leave.tgl2],
      );

      for (const r of rows) {
        await conn.query(
          `UPDATE t_leave_quota
          SET quota = quota + 1
          WHERE id = ?`,
          [r.leave_quota_id],
        );

        await conn.query(
          `UPDATE t_leave_usage 
          SET fl_hapus = 1 
          WHERE id = ?`,
          [r.id],
        );
      }
    }

    await conn.query(
      `UPDATE t_absensi 
      SET attendance_status = 0, leave_request_id = NULL
      WHERE regnum = ? 
      AND asattenddate_rev BETWEEN ? AND ?
      AND leave_request_id = ?`,
      [leave.regnum, leave.tgl1, leave.tgl2, id],
    );

    await conn.query(
      `UPDATE t_leave 
      SET fl_approve = 4, rejection_notes = ?, approved_by = ?, approved_log = NOW()
      WHERE id = ?`,
      [notes, loginRegnum, id],
    );

    const [[revision]] = await conn.query(
      `SELECT id
      FROM t_leave_revision
      WHERE t_leave_id = ? AND fl_approve = 1 FOR UPDATE`,
      [id],
    );

    if (revision) {
      await conn.query(
        `UPDATE t_leave_revision 
        SET fl_approve = 4, approved_by = ?, approved_log = NOW()
        WHERE id = ?`,
        [loginRegnum, revision.id],
      );
    }

    await conn.commit();
    return res.status(200).json({ message: "Approval Revoked!" });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function fetchLeaveUsage(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const loginRegnum = req.user.regnum;
    const { startDate, endDate, type, targetRegnum } = req.query;
    const parsedLeaveYear = Number(req.query.leaveYear);
    const leaveYear =
      req.query.leaveYear === "ALL" ||
      Number(type) !== 3 ||
      Number.isNaN(parsedLeaveYear)
        ? null
        : Number(req.query.leaveYear);

    if (targetRegnum !== loginRegnum) {
      const [[authority]] = await conn.query(
        `SELECT 1 FROM reg_person 
          WHERE regnum = ? OR approver = ?`,
        [targetRegnum, loginRegnum],
      );

      if (!authority) {
        throw new BusinessError("FORBIDDEN", "Forbidden");
      }
    }

    const [leaves] = await conn.query(
      `SELECT
        tl.id,
        tl.tgl1,
        tl.tgl2,
        tl.keterangan,
        tl.fl_approve,
        tl.log_date,
        ml.nama AS leave_name,
        (
        SELECT COUNT(*)
        FROM m_work_calendar mwc
        WHERE mwc.work_date BETWEEN tl.tgl1 AND tl.tgl2
        AND mwc.is_workday = 1
      ) AS total_days
      FROM
        t_leave tl
        JOIN m_leave ml
          ON tl.leave_id = ml.id
      WHERE tl.regnum = ?
        AND tl.fl_hapus = 0
        AND tl.fl_approve = 1
        AND (
          tl.tgl1 BETWEEN ? AND ?
          OR tl.tgl2 BETWEEN ? AND ?
          OR (? BETWEEN tl.tgl1 AND tl.tgl2)
        )
        AND tl.leave_id = ?
        AND (
          ? IS NULL
          OR EXISTS (
            SELECT 1
            FROM t_leave_usage tlu
            JOIN t_leave_quota tlq
              ON tlq.id = tlu.leave_quota_id
            WHERE tlu.leave_request_id = tl.id
              AND tlq.year = ?
          )
        )
      GROUP BY tl.id
      ORDER BY tl.tgl1 DESC
      `,
      [
        targetRegnum,
        startDate,
        endDate,
        startDate,
        endDate,
        startDate,
        type,
        leaveYear,
        leaveYear,
      ],
    );

    const leaveIds = leaves.map((l) => l.id);

    if (leaveIds.length === 0) {
      return res.status(200).json([]);
    }

    const [usageRows] = await conn.query(
      `SELECT
          tlu.leave_request_id,
          tlq.year,
          SUM(tlu.days) AS used_days
      FROM t_leave_usage tlu
      JOIN t_leave_quota tlq
          ON tlu.leave_quota_id = tlq.id
      WHERE tlu.leave_request_id IN (?)
      AND COALESCE(tlu.fl_hapus, 0) = 0
      GROUP BY tlu.leave_request_id, tlq.year`,
      [leaveIds],
    );

    const usageMap = {};

    for (const row of usageRows) {
      if (!usageMap[row.leave_request_id]) {
        usageMap[row.leave_request_id] = [];
      }

      usageMap[row.leave_request_id].push({
        year: row.year,
        used_days: row.used_days,
      });
    }

    const result = leaves.map((leave) => ({
      ...leave,
      quota_usage: usageMap[leave.id] || [],
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function fetchLeaveUsageSummary(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const regnum = req.user.regnum;
    const targetRegnum = Number(req.query.targetRegnum);

    if (targetRegnum !== regnum) {
      const [[authority]] = await conn.query(
        `SELECT 1 FROM reg_person 
          WHERE regnum = ? AND approver = ?`,
        [targetRegnum, regnum],
      );

      if (!authority) {
        throw new BusinessError("FORBIDDEN", "Forbidden");
      }
    }

    const [[remaining]] = await conn.query(
      `SELECT COALESCE(SUM(quota),0) AS remaining_leave
        FROM t_leave_quota
        WHERE regnum = ?
        AND effective_date <= CURDATE()
        AND expired_at >= CURDATE()`,
      [targetRegnum],
    );

    const [[used]] = await conn.query(
      `SELECT COALESCE(SUM(tlu.days),0) AS used_this_year
        FROM t_leave_usage tlu
        JOIN t_leave tl
          ON tlu.leave_request_id = tl.id
        WHERE tl.regnum = ?
        AND tl.fl_approve = 1
        AND tl.leave_id = ?
        AND tlu.fl_hapus = 0
        AND YEAR(tlu.leave_date) = YEAR(CURDATE())`,
      [targetRegnum, 3],
    );

    const [[expiring]] = await conn.query(
      `SELECT
          quota,
          expired_at
        FROM t_leave_quota
        WHERE regnum = ?
        AND quota > 0
        AND expired_at >= CURDATE()
        ORDER BY expired_at ASC
        LIMIT 1`,
      [targetRegnum],
    );

    const summary = {
      remaining,
      used,
      expiring,
    };

    res.json(summary);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function fetchLeaveYear(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const regnum = req.user.regnum;
    const targetRegnum = Number(req.query.targetRegnum);

    if (targetRegnum !== regnum) {
      const [[authority]] = await conn.query(
        `SELECT 1 FROM reg_person 
          WHERE regnum = ? AND approver = ?`,
        [targetRegnum, regnum],
      );

      if (!authority) {
        throw new BusinessError("FORBIDDEN", "Forbidden");
      }
    }

    const [year] = await dbAbsensi.query(
      `SELECT DISTINCT YEAR AS leave_year 
      FROM t_leave_quota
      WHERE regnum = ? 
      ORDER BY year DESC`,
      [targetRegnum],
    );

    res.json(year);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function bulkLeaveApprove(req, res) {
  const conn = await dbAbsensi.getConnection();
  try {
    const { ids } = req.body;
    const loginRegnum = req.user.regnum;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Tidak ada request yang dipilih",
      );
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT * FROM t_leave 
      WHERE id IN (?) AND
      fl_approve = 0 
      FOR UPDATE`,
      [ids],
    );

    if (rows.length !== ids.length) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Terdapat leave yang tidak valid",
      );
    }

    for (const leave of rows) {
      await approveLeave(conn, leave, loginRegnum);
    }

    await conn.commit();
    res.status(200).json({ message: "Request Approved!" });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function getMedicalCertificate(req, res) {
  const conn = await dbAbsensi.getConnection();
  try {
    const loginRegnum = req.user.regnum;
    const { id } = req.params;

    const [[leave]] = await conn.query(
      `
      SELECT a.regnum, a.medical_certificate_name, b.approver
      FROM t_leave a 
      LEFT JOIN reg_person b 
        ON a.regnum = b.regnum
      WHERE a.id = ? AND fl_hapus = 0`,
      [id],
    );

    if (!leave) {
      throw new BusinessError("LEAVE_NOT_FOUND", "Request tidak ditemukan");
    }

    if (leave.regnum !== loginRegnum) {
      await authorityChecking(conn, leave.regnum, loginRegnum);
    }

    if (!leave.medical_certificate_name) {
      throw new BusinessError(
        "ATTACHMENT_NOT_FOUND",
        "Lampiran tidak ditemukan",
      );
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "medicalCertificate",
      leave.medical_certificate_name,
    );

    if (!fs.existsSync(filePath)) {
      throw new BusinessError("FILE_NOT_FOUND", "File tidak ditemukan");
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}
