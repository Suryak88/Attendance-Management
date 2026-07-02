import dbAbsensi from "../config/dbAbsensi.js";
import { BusinessError } from "../errors/BusinessError.js";
import { approveCorrection } from "../services/approveCorrectionService.js";
import { getLastAttendanceImported } from "../services/getLastAttendanceImported.js";
import { validateAttendanceImported } from "../services/validateAttendanceImported.js";
import { validateRangeNotClosed } from "../utils/validateNotClosed.js";

export async function showCorrectionReqHistory(req, res) {
  try {
    const regnum = req.user.regnum;

    const [history] = await dbAbsensi.query(
      `	SELECT a.*, b.namalengkap AS approver,
	      GREATEST(TIMESTAMPDIFF(MINUTE, CONCAT(DATE(a.masuk), ' ', s.jam_masuk), a.masuk ), 0 ) AS telat,
	      GREATEST(TIMESTAMPDIFF(MINUTE, a.pulang, CONCAT(DATE(a.pulang), ' ', s.jam_pulang)), 0) AS pulang_cepat
        FROM t_correction a 
        LEFT JOIN reg_person b ON a.approved_by = b.regnum 
        LEFT JOIN m_work_calendar wc ON wc.work_date = a.tgl
	      LEFT JOIN m_shift s ON s.id = wc.shift_id
        WHERE a.regnum = ?
        ORDER BY a.id DESC`,
      [regnum],
    );

    res.json(history);
  } catch (error) {
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
  }
}

export async function addCorrection(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const regnum = req.user.regnum;
    const {
      name,
      date,
      clockIn,
      clockOut,
      description,
      lateExcused,
      earlyLeaveExcused,
    } = req.body;
    const today = new Date();

    await conn.beginTransaction();

    await validateRangeNotClosed(conn, regnum, date, date);
    const lastImported = await getLastAttendanceImported(conn);

    const [[overlap]] = await conn.query(
      `SELECT COUNT(*) as total 
          FROM t_correction 
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

    const [rows] = await conn.query(
      `SELECT 
        MIN(CASE WHEN a.checkcode_rev = 0 THEN a.checkdatetime_rev END) AS masuk,
        MAX(CASE WHEN a.checkcode_rev = 1 THEN a.checkdatetime_rev END) AS pulang,
	      s.jam_masuk, s.jam_pulang
        FROM t_absensi a
        LEFT JOIN m_work_calendar wc on a.asattenddate_rev = wc.work_date
        LEFT JOIN m_shift s on wc.shift_id = s.id
        WHERE regnum = ? AND asattenddate_rev = ?
        GROUP BY s.jam_masuk, s.jam_pulang`,
      [regnum, date],
    );

    const existing = rows[0];

    let late = 0;
    let earlyLeave = 0;

    if (existing?.masuk) {
      late = Math.max(
        0,
        Math.floor(
          (new Date(existing?.masuk) -
            new Date(`${date} ${existing?.jam_masuk}`)) /
            60000,
        ),
      );
    }
    if (existing?.pulang) {
      earlyLeave = Math.max(
        0,
        Math.floor(
          (new Date(`${date} ${existing?.jam_pulang}`) -
            new Date(existing?.pulang)) /
            60000,
        ),
      );
    }

    let correctionType;

    if (new Date(date) > new Date(lastImported)) {
      if (lateExcused && earlyLeaveExcused) {
        correctionType = "IZIN_TELAT_PULANG_CEPAT";
      } else if (lateExcused) {
        correctionType = "IZIN_TELAT";
      } else if (earlyLeaveExcused) {
        correctionType = "IZIN_PULANG_CEPAT";
      }
    } else {
      if (!existing?.masuk && !existing?.pulang && clockIn && clockOut) {
        correctionType = "ISI_ABSEN_MASUK_PULANG";
      } else if (!existing?.pulang && clockOut) {
        correctionType = "ISI_ABSEN_PULANG";
      } else if (!existing?.masuk && clockIn) {
        correctionType = "ISI_ABSEN_MASUK";
      } else {
        if (late > 0 && earlyLeave > 0) {
          correctionType = "IZIN_TELAT_PULANG_CEPAT";
        } else if (late > 0) {
          correctionType = "IZIN_TELAT";
        } else if (earlyLeave > 0) {
          correctionType = "IZIN_PULANG_CEPAT";
        } else {
          throw new BusinessError(
            "INVALID_REQUEST",
            "Tidak ada kondisi koreksi yang terdeteksi",
          );
        }
      }
    }

    if (
      correctionType === "IZIN_TELAT" ||
      correctionType === "IZIN_PULANG_CEPAT" ||
      correctionType === "IZIN_TELAT_PULANG_CEPAT"
    ) {
      if (existing.masuk !== clockIn || existing.pulang !== clockOut) {
        throw new BusinessError("TIME_CONFLICT", `Jam tidak boleh diubah!`);
      }
    }

    await conn.query(
      "INSERT INTO t_correction (regnum, fullname, tgl, masuk, pulang, keterangan, correction_type, entry_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        regnum,
        name,
        date,
        clockIn,
        clockOut,
        description,
        correctionType,
        regnum,
      ],
    );

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

export async function showCorrectionRequest(req, res) {
  try {
    const regnum = req.user.regnum;
    const { startDate, endDate, status, targetRegnum } = req.query;

    let query = `SELECT a.*, b.namalengkap, b.divisi, b.jabatan,
        CASE WHEN a.fl_approve = 0 THEN 'Pending' 
        WHEN a.fl_approve = 1 THEN 'Approved'
        ELSE 'Rejected' END AS "status",
        GREATEST(TIMESTAMPDIFF(MINUTE, CONCAT(DATE(a.masuk), ' ', s.jam_masuk), a.masuk ), 0 ) AS telat,
        GREATEST(TIMESTAMPDIFF(MINUTE, a.pulang, CONCAT(DATE(a.pulang), ' ', s.jam_pulang)), 0) AS pulang_cepat
        FROM t_correction a
        LEFT JOIN reg_person b ON a.regnum = b.regnum 
        LEFT JOIN m_work_calendar wc ON wc.work_date = a.tgl
	      LEFT JOIN m_shift s ON s.id = wc.shift_id
        WHERE b.approver = ? 
        AND a.tgl BETWEEN ? AND ?
        AND a.fl_approve <> 3 `;

    const params = [regnum, startDate, endDate];

    if (targetRegnum) {
      query += " AND a.regnum = ?";
      params.push(targetRegnum);
    }

    if (status !== "all") {
      query += " AND a.fl_approve = ?";
      params.push(status);
    }

    query += "ORDER BY a.id DESC";

    const [rows] = await dbAbsensi.query(query, params);

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function approveCorrectionReq(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { id } = req.params;
    const regnum = req.user.regnum;
    const { clockIn, clockOut, lateExcused, earlyLeaveExcused } = req.body;

    await conn.beginTransaction();

    const [[request]] = await conn.query(
      `SELECT * FROM t_correction WHERE id = ? AND fl_approve = 0 FOR UPDATE`,
      [id],
    );

    if (!request) {
      throw new BusinessError("INVALID_REQUEST", "Request tidak valid");
    }

    await approveCorrection(
      conn,
      request,
      regnum,
      clockIn,
      clockOut,
      lateExcused,
      earlyLeaveExcused,
    );

    // const [[authority]] = await conn.query(
    //   `SELECT 1 FROM reg_person
    //   WHERE regnum = ? AND approver = ?`,
    //   [request.regnum, regnum],
    // );

    // if (!authority) {
    //   throw new BusinessError("FORBIDDEN", "Forbidden");
    // }

    // await validateRangeNotClosed(
    //   conn,
    //   request.regnum,
    //   request.tgl,
    //   request.tgl,
    // );

    // let query = `UPDATE t_correction SET fl_approve = 1, approved_by = ?, approved_log = NOW()`;
    // const params = [regnum];

    // const isClockInChanged = clockIn !== null && clockIn !== request.masuk;
    // const isClockOutChanged = clockOut !== null && clockOut !== request.pulang;

    // if (isClockInChanged) {
    //   query += `, masuk = ?`;
    //   params.push(clockIn);
    // }
    // if (isClockOutChanged) {
    //   query += `, pulang = ?`;
    //   params.push(clockOut);
    // }

    // query += ` WHERE id = ?`;
    // params.push(id);

    // await conn.query(query, params);

    // if (isClockInChanged || isClockOutChanged) {
    //   await conn.query(
    //     `
    //     INSERT INTO t_correction_revision (t_correction_id, old_masuk, new_masuk, old_pulang, new_pulang, entry_by)
    //     VALUES (?, ?, ?, ?, ?, ?)`,
    //     [id, request.masuk, clockIn, request.pulang, clockOut, regnum],
    //   );
    // }

    // await conn.query(`CALL khdeteksi_lembur(?, ?, ?)`, [
    //   request.tgl,
    //   request.tgl,
    //   request.regnum,
    // ]);

    await conn.commit();
    return res.status(200).json({ message: "Request approved!" });
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

export async function rejectCorrectionReq(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const regnum = req.user.regnum;

    await dbAbsensi.query(
      `UPDATE t_correction SET fl_approve = 2, rejection_notes = ?, approved_by = ?, approved_log = NOW() WHERE id = ?`,
      [notes, regnum, id],
    );

    return res.status(200).json({ message: "Request rejected!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export async function cancelCorrectionRequest(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { id } = req.params;
    const regnum = req.user.regnum;

    await conn.beginTransaction();

    const [[correction]] = await conn.query(
      `SELECT * FROM t_correction WHERE id = ? AND regnum = ? AND fl_approve = 0 FOR UPDATE`,
      [id, regnum],
    );

    if (!correction) {
      await conn.rollback();
      return res.status(409).json({
        message: "Request tidak ditemukan atau sudah diproses",
      });
    }

    const [result] = await conn.query(
      `UPDATE t_correction SET fl_approve = 3, approved_by = ?, approved_log = NOW() WHERE id = ? AND fl_approve = 0`,
      [regnum, id],
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "Request gagal dibatalkan",
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

export async function bulkCorrectionApprove(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { ids } = req.body;
    const loginRegnum = req.user.regnum;
    console.log("IDS:", ids);

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BusinessError(
        "INVALID_REQUEST",
        "Tidak ada request yang dipilih",
      );
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT * FROM t_correction WHERE id IN (?) AND fl_approve = 0 FOR UPDATE`,
      [ids],
    );

    if (rows.length !== ids.length) {
      const foundIds = rows.map((r) => r.id);

      const invalidIds = ids.filter((id) => !foundIds.includes(id));

      console.log("requested ids:", ids);
      console.log("found ids:", foundIds);
      console.log("invalid ids:", invalidIds);
      throw new BusinessError(
        "INVALID_REQUEST",
        "Terdapat leave yang tidak valid",
      );
    }

    console.log(
      "FOUND:",
      rows.map((r) => ({
        id: r.id,
        fl_approve: r.fl_approve,
      })),
    );
    console.log(
      "missing:",
      ids.filter((id) => !rows.some((r) => r.id === id)),
    );
    for (const request of rows) {
      await approveCorrection(conn, request, loginRegnum, null, null);
    }

    await conn.commit();
    res.status(200).json({ message: "Request Approved!" });
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

export async function fetchLastSynced(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const { date } = req.query;
    const importedUntil = await getLastAttendanceImported(conn);

    res.json(importedUntil);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}
