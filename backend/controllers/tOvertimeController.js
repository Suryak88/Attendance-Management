import dbAbsensi from "../config/dbAbsensi.js";
import { BusinessError } from "../errors/BusinessError.js";
import { createNotification } from "../services/Notification/notificationService.js";
import { formatDateIndo } from "../utils/date.js";
import {
  validateDatesNotClosed,
  validateRangeNotClosed,
} from "../utils/validateNotClosed.js";

function getOvertimeApprovalSelectQuery() {
  //Query Approver
  return `
  SELECT
    	  a.*,
    	  b.namalengkap,
    	  d.nama AS departemen,
    	  e.departemen_id, 
    	  e.nama AS jabatan,
    	  GREATEST(
    	    0,
    	    TIMESTAMPDIFF(
    	      MINUTE,
    	      TIMESTAMP(a.tgl, s.jam_masuk),
    	      a.masuk
    	    )
    	  ) AS telat
    	FROM t_overtime a
      LEFT JOIN reg_person b ON a.regnum = b.regnum 
      LEFT JOIN m_work_calendar wc ON a.tgl = wc.work_date
      LEFT JOIN m_shift s ON wc.shift_id = s.id 
      LEFT JOIN m_departemen d ON b.departemen_id = d.id
      LEFT JOIN m_jabatan e ON b.jabatan_id = e.id`;
}

function getEmployeeOvertimeSelectQuery() {
  //Query Employee
  return `
      SELECT a.*,
    GREATEST(
    	    0,
    	    TIMESTAMPDIFF(
    	      MINUTE,
    	      TIMESTAMP(a.tgl, s.jam_masuk),
    	      a.masuk
    	    )
    	  ) AS telat,
    CASE
    WHEN overtime_hours IS NULL THEN 'WAITING_DETECTION'
    WHEN keterangan IS NULL OR TRIM(keterangan) = '' THEN 'NEED_DESCRIPTION'
    WHEN fl_approve = 0 THEN 'WAITING_APPROVAL'
    WHEN fl_approve = 1 AND applied_at IS NOT NULL THEN 'APPLIED'
    WHEN fl_approve = 2 THEN 'REJECTED'
    END AS overtime_status 
    FROM t_overtime a
    LEFT JOIN m_work_calendar wc ON a.tgl = wc.work_date
    LEFT JOIN m_shift s ON wc.shift_id = s.id`;
}

function formatEmployeeOvertime(overtime) {
  let overtime_status_formatted;

  switch (overtime.overtime_status) {
    case "WAITING_DETECTION":
      overtime_status_formatted = "Waiting Overtime Detection";
      break;
    case "NEED_DESCRIPTION":
      overtime_status_formatted = "Need Description";
      break;
    case "WAITING_APPROVAL":
      overtime_status_formatted = "Waiting for Approval";
      break;
    case "APPLIED":
      overtime_status_formatted = "Applied";
      break;
    case "REJECTED":
      overtime_status_formatted = "Rejected";
      break;
    default:
      overtime_status_formatted = "-";
      break;
  }

  return {
    ...overtime,
    overtime_status_formatted,
  };
}

export async function addOvertime(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const regnum = req.user.regnum;
    const { date, description } = req.body;
    let overtime_id = null;
    await conn.beginTransaction();

    await validateRangeNotClosed(conn, regnum, date, date);

    const [[employee]] = await conn.query(
      `SELECT namalengkap, approver FROM reg_person 
      WHERE regnum = ?`,
      [regnum],
    );

    const [[request]] = await conn.query(
      `SELECT *
        FROM t_overtime
        WHERE regnum = ?
            AND fl_hapus = 0
            AND fl_approve IN (0,1)
            AND tgl = ?
        FOR UPDATE`,
      [regnum, date],
    );

    if (request) {
      if (
        request.overtime_hours &&
        (!request.keterangan || request.keterangan.trim() === "")
      ) {
        await conn.query(
          `UPDATE t_overtime SET keterangan = ?
            WHERE id = ?`,
          [description, request.id],
        );
        overtime_id = request.id;
      } else {
        throw new BusinessError(
          "DUPLICATE_REQUEST",
          `Sudah terdapat request lembur untuk tanggal ${formatDateIndo(date)}`,
        );
      }
    } else {
      const [result] = await conn.query(
        `INSERT INTO t_overtime (regnum, fullname, tgl, keterangan, entry_by)
          VALUES (?, ?, ?, ?, ?)`,
        [regnum, employee.namalengkap.trim(), date, description, regnum],
      );
      overtime_id = result.insertId;
    }

    await createNotification(conn, {
      regnum: employee.approver,
      type: "OVERTIME_SUBMITTED",
      data: {
        employeeName: employee.namalengkap.trim(),
        tgl: date,
      },
      reference_type: "OVERTIME",
      reference_id: overtime_id,
    });

    await conn.commit();

    res.status(201).json({
      message: "Form sent!",
    });
  } catch (error) {
    await conn.rollback();
    console.log(error);
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

export async function showOvertimeRequest(req, res) {
  try {
    const regnum = req.user.regnum;
    const { startDate, endDate, status, targetRegnum } = req.query;

    let query = `${getOvertimeApprovalSelectQuery()}
      WHERE b.approver = ? 
      AND a.tgl BETWEEN ? AND ?
      AND a.fl_hapus = 0
      AND a.keterangan IS NOT NULL     
      AND TRIM(a.keterangan) <> ''
      AND a.fl_approve <> 3`;

    const params = [regnum, startDate, endDate];

    if (targetRegnum) {
      query += " AND a.regnum = ?";
      params.push(targetRegnum);
    }

    if (status !== "all") {
      query += " AND a.fl_approve = ?";
      params.push(status);
    }

    query += " ORDER BY a.id DESC";

    const [rows] = await dbAbsensi.query(query, params);

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function rejectOvertimeReq(req, res) {
  const conn = await dbAbsensi.getConnection();
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const regnum = req.user.regnum;

    await conn.beginTransaction();

    const [[rows]] = await conn.query(
      `SELECT * FROM t_overtime WHERE id = ? AND fl_approve = 0 FOR UPDATE`,
      [id],
    );

    if (!rows) {
      throw new BusinessError("INVALID_REQUEST", "Request tidak valid");
    }

    await conn.query(
      `UPDATE t_overtime SET fl_approve = 2, rejection_notes = ?, approved_by = ?, approved_log = NOW() WHERE id = ?`,
      [notes, regnum, id],
    );

    await createNotification(conn, {
      regnum: rows.regnum,
      type: "OVERTIME_REJECTED",
      data: {
        tgl: rows.tgl,
      },
      reference_type: "OVERTIME",
      reference_id: id,
    });

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

export async function approveOvertimeReq(req, res) {
  const conn = await dbAbsensi.getConnection();
  try {
    const { id } = req.params;
    const regnum = req.user.regnum;

    await conn.beginTransaction();

    const [[rows]] = await conn.query(
      `SELECT * FROM t_overtime WHERE id = ? AND fl_approve = 0 FOR UPDATE`,
      [id],
    );

    if (!rows) {
      throw new BusinessError("INVALID_REQUEST", "Request tidak valid");
    }

    await validateRangeNotClosed(conn, rows.regnum, rows.tgl, rows.tgl);

    await conn.query(
      `UPDATE t_overtime SET fl_approve = 1, approved_by = ?, approved_log = NOW() WHERE id = ?`,
      [regnum, id],
    );

    await conn.query("CALL khApply_Overtime()");

    await createNotification(conn, {
      regnum: rows.regnum,
      type: "OVERTIME_APPROVED",
      data: {
        tgl: rows.tgl,
      },
      reference_type: "OVERTIME",
      reference_id: id,
    });

    await conn.commit();
    res.status(200).json({ message: "Request approved!" });
  } catch (error) {
    await conn.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function showOvertime(req, res) {
  try {
    const { startDate, endDate, limit, date } = req.query;
    const regnum = req.user.regnum;

    let query = `
    ${getEmployeeOvertimeSelectQuery()}
    WHERE regnum = ?
    AND a.fl_hapus = 0
    `;

    const params = [regnum];

    if (startDate && endDate) {
      query += ` AND tgl BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    if (date) {
      query += ` AND a.tgl = ?`;
      params.push(date);
    }

    query += " ORDER BY tgl DESC";

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    const [overtime] = await dbAbsensi.query(query, params);

    const data = overtime.map(formatEmployeeOvertime);

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function checkOvertime(req, res) {
  try {
    const regnum = req.user.regnum;
    const { date } = req.query;

    const [[data]] = await dbAbsensi.query(`CALL khcheck_lembur(?, ?)`, [
      date,
      regnum,
    ]);

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function bulkApproveOvertime(req, res) {
  const conn = await dbAbsensi.getConnection();
  try {
    const { ids } = req.body;
    const regnum = req.user.regnum;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Tidak ada request yang dipilih",
      );
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT * FROM t_overtime 
      WHERE id IN (?) AND
      fl_approve = 0 
      FOR UPDATE`,
      [ids],
    );

    if (rows.length !== ids.length) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Terdapat overtime yang tidak valid",
      );
    }

    const groupedDates = {};

    for (const r of rows) {
      if (!groupedDates[r.regnum]) {
        groupedDates[r.regnum] = [];
      }

      groupedDates[r.regnum].push(r.tgl);
    }

    for (const regnum in groupedDates) {
      await validateDatesNotClosed(conn, regnum, groupedDates[regnum]);
    }

    await conn.query(
      `UPDATE t_overtime 
      SET fl_approve = 1, approved_by = ?, approved_log = NOW()
      WHERE id IN (?)`,
      [regnum, ids],
    );

    await conn.query("CALL khApply_Overtime()");

    for (const r of rows) {
      await createNotification(conn, {
        regnum: r.regnum,
        type: "OVERTIME_APPROVED",
        data: {
          tgl: r.tgl,
        },
        reference_type: "OVERTIME",
        reference_id: r.id,
      });
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

export async function fetchSpecificOvertimeRequest(req, res) {
  try {
    const regnum = req.user.regnum;
    const { id } = req.params;

    const [[request]] = await dbAbsensi.query(
      `
      ${getOvertimeApprovalSelectQuery()}
      WHERE b.approver = ?
      AND a.id = ?
      AND a.fl_hapus = 0
      `,
      [regnum, id],
    );

    if (!request) {
      return res.status(404).json({
        message: "Overtime request tidak ditemukan",
      });
    }

    res.status(200).json(request);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// Untuk yg di employee, History bar lalu klik detail
export async function fetchSpecificEmployeeOvertime(req, res) {
  try {
    const regnum = req.user.regnum;
    const { id } = req.params;

    const [[result]] = await dbAbsensi.query(
      `${getEmployeeOvertimeSelectQuery()}
      WHERE a.regnum = ? 
      AND a.id = ? 
      AND a.fl_hapus = 0`,
      [regnum, id],
    );

    if (!result) {
      return res.status(404).json({
        message: "Overtime request tidak ditemukan",
      });
    }

    const data = formatEmployeeOvertime(result);

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}
