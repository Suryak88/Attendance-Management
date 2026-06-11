import dbAbsensi from "../config/dbAbsensi.js";
import { BusinessError } from "../errors/BusinessError.js";
import { formatMySQLTime } from "../utils/date.js";
import {
  calculateOvertimeHours,
  calculateRealHours,
  roundOvertimeHours,
} from "../utils/overtimeCalculator.js";
import {
  validateDatesNotClosed,
  validateRangeNotClosed,
} from "../utils/validateNotClosed.js";

export async function addOvertime(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const regnum = req.user.regnum;
    const { name, date, description } = req.body;

    await conn.beginTransaction();

    const [[workday]] = await conn.query(
      `SELECT is_workday
        FROM m_work_calendar
        WHERE work_date = ?`,
      [date],
    );

    if (workday === 0) {
      throw new BusinessError("HOLIDAY_DATE", "Tanggal merupakan hari libur");
    }

    const [[overlap]] = await conn.query(
      `SELECT COUNT(*) AS total
        FROM t_overtime
        WHERE regnum = ?
            AND fl_hapus = 0
            AND fl_approve IN (0,1) 
            AND tgl = ?`,
      [regnum, date],
    );

    if (overlap.total > 0) {
      throw new BusinessError(
        "DUPLICATE_REQUEST",
        `Sudah terdapat request koreksi untuk tanggal ${date}`,
      );
    }

    const [clockOut] = await conn.query(
      `SELECT MAX(CASE WHEN checkcode_rev = 1 THEN checkdatetime_rev END) AS pulang
            FROM t_absensi 
            WHERE regnum = ? AND asattenddate_rev = ?`,
      [regnum, date],
    );

    if (clockOut.length === 0) {
      throw new BusinessError("NO_CLOCKOUT", "Tidak ada data jam pulang");
    }

    console.log(formatMySQLTime(clockOut[0].pulang));

    if (formatMySQLTime(clockOut[0].pulang) < "19:00:00") {
      throw new BusinessError(
        "NO_OVERTIME",
        "Jam pulang tidak memenuhi standar jam lembur",
      );
    }

    const roundedHours = roundOvertimeHours(clockOut[0].pulang);
    const realHours = calculateRealHours(roundedHours);
    const overtimeHours = calculateOvertimeHours(realHours);

    console.log(`roundedHours: ${roundedHours}`);
    console.log(`realHours: ${realHours}`);
    console.log(`overtimeHours: ${overtimeHours}`);

    // await conn.query(
    //   `INSERT INTO t_overtime (regnum, fullname, tgl, pulang, pulang_rounded, real_hours, overtime_hours, keterangan, entry_by)`,
    //   [regnum],
    // );

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

    let query = `SELECT
    	  a.*,
    	  b.namalengkap,
    	  b.divisi,
    	  b.jabatan,
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
      WHERE b.approver = ? 
      AND a.tgl BETWEEN ? AND ?
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
    const { startDate, endDate, limit } = req.query;
    const regnum = req.user.regnum;

    let query = `
    SELECT a.*,
    GREATEST(
    	    0,
    	    TIMESTAMPDIFF(
    	      MINUTE,
    	      TIMESTAMP(a.tgl, s.jam_masuk),
    	      a.masuk
    	    )
    	  ) AS telat 
    FROM t_overtime a
    LEFT JOIN m_work_calendar wc ON a.tgl = wc.work_date
    LEFT JOIN m_shift s ON wc.shift_id = s.id 
    WHERE regnum = ?
    `;

    const params = [regnum];

    if (startDate && endDate) {
      query += ` AND tgl BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += " ORDER BY tgl DESC";

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    const [overtime] = await dbAbsensi.query(query, params);

    res.json(overtime);
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
