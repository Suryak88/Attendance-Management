import dbAbsensi from "../config/dbAbsensi.js";
import bcrypt from "bcrypt";
import {
  formatLocalDate,
  formatMySQLTime,
  isoUtcToMySQLLocal,
  toDateOnly,
} from "../utils/date.js";

export async function getInitialForm(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const [[regnum]] = await conn.query(
      `SELECT MAX(regnum) as regnum FROM reg_person`,
    );
    const nextRegnum = Number(regnum.regnum) + 1;

    const [company] = await conn.query(
      "SELECT * FROM m_company WHERE fl_hapus = 0",
    );

    const [divisi] = await conn.query(
      "SELECT * FROM m_divisi WHERE fl_hapus = 0",
    );

    const [departemen] = await conn.query(
      "SELECT * FROM m_departemen WHERE fl_hapus = 0",
    );

    const [jabatan] = await conn.query(
      "SELECT * FROM m_jabatan WHERE fl_hapus = 0",
    );

    const [lantai] = await conn.query("SELECT * FROM m_floor");

    const [approver] = await conn.query(
      `SELECT regnum, namalengkap FROM reg_person WHERE role = "SUPERVISOR"`,
    );

    res.json({
      nextRegnum,
      company,
      divisi,
      departemen,
      jabatan,
      lantai,
      approver,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function addEmployee(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const {
      nama,
      nik,
      tempatLahir,
      tanggalLahir,
      regnum,
      perusahaan,
      divisi,
      departemen,
      jabatan,
      lantai,
      approver,
      mulaiKerja,
      mulaiCuti,
      overtimeEnabled,
    } = req.body;
    await conn.beginTransaction();
    let employeeRegnum = regnum;

    const [[regnumDB]] = await conn.query(`
      SELECT MAX(regnum) AS regnum FROM reg_person`);
    const nextRegnum = Number(regnumDB.regnum) + 1;

    const [usedRegnum] = await conn.query(
      `
      SELECT 1 FROM reg_person WHERE regnum = ?`,
      [regnum],
    );

    if (nextRegnum !== regnum && usedRegnum.length !== 0 && !req.body.force) {
      employeeRegnum = nextRegnum;
      return res.status(409).json({
        code: "REGNUM_HAS_BEEN_USED",
        nextRegnum,
        message: "Regnum yg dikirim sudah digunakan",
      });
    }

    const role = "STAFF";
    const bcryptHash = await bcrypt.hash(employeeRegnum, 10);

    const now = new Date();
    const date = isoUtcToMySQLLocal(now).slice(0, 10);
    const time = isoUtcToMySQLLocal(now).slice(11, 19);

    const startWorkYear = Number(mulaiKerja.slice(0, 4));

    const expired = `${startWorkYear + 1}-03-31`;

    console.log("ini addEmployee");
    await conn.query(
      `INSERT INTO reg_person
      (regnum, namalengkap, nik, tempat_lahir, tanggal_lahir, mulai_kerja, company_id, divisi_id, departemen_id, jabatan_id, role, floor_id, log_date, approver, is_overtime_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        employeeRegnum,
        nama.trim(),
        nik,
        tempatLahir.toUpperCase(),
        tanggalLahir,
        mulaiKerja,
        perusahaan,
        divisi,
        departemen,
        jabatan,
        role,
        lantai,
        approver,
        overtimeEnabled,
      ],
    );

    await conn.query(
      `INSERT INTO m_users
      (card_id, nama, password, entry_date, entry_time, regnum)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        employeeRegnum,
        nama.trim().toUpperCase(),
        bcryptHash,
        date,
        time,
        employeeRegnum,
      ],
    );

    if (mulaiCuti <= expired) {
      await conn.query(
        `INSERT INTO t_leave_quota
        (regnum, year, quota, effective_date, expired_at)
        VALUES (?, ?, ?, ?, ?)`,
        [employeeRegnum, startWorkYear, 12, mulaiCuti, expired],
      );
    }

    await conn.query(`CALL khWork_Calendar(?, ?)`, [
      mulaiKerja,
      employeeRegnum,
    ]);

    await conn.commit();
    res.status(201).json({
      message: "Success!",
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}

export async function fetchAllEmployee(req, res) {
  try {
    const { perusahaan, divisi, departemen, jabatan } = req.query;

    let query = `SELECT rp.regnum, rp.namalengkap, rp.mulai_kerja, 
      rp.company_id, c.nama AS company_name, rp.divisi_id, dv.nama AS divisi_name, 
      rp.departemen_id, dp.nama AS departemen_name, rp.jabatan_id, j.nama AS jabatan_name, 
      rp.floor_id, f.floor_name,
      rp.role, rp.approver, rp2.namalengkap as approver_name,
      rp.nik, rp.tempat_lahir, rp.tanggal_lahir
      FROM reg_person rp
      LEFT JOIN m_company c ON rp.company_id = c.id
      LEFT JOIN m_divisi dv ON rp.divisi_id = dv.id
      LEFT JOIN m_departemen dp ON rp.departemen_id = dp.id 
      LEFT JOIN m_jabatan j ON rp.jabatan_id = j.id
      LEFT JOIN m_floor f ON rp.floor_id = f.id
      INNER JOIN reg_person rp2 ON rp.approver = rp2.regnum`;
    const conditions = [];
    const params = [];

    if (perusahaan !== "all") {
      conditions.push(`rp.company_id = ?`);
      params.push(perusahaan);
    }

    if (divisi !== "all") {
      conditions.push(`rp.divisi_id = ?`);
      params.push(divisi);
    }

    if (departemen !== "all") {
      conditions.push(`rp.departemen_id = ?`);
      params.push(departemen);
    }

    if (jabatan !== "all") {
      conditions.push(`rp.jabatan_id = ?`);
      params.push(jabatan);
    }

    if (conditions.length > 0) {
      query += ` WHERE rp.approver IS NOT NULL AND ${conditions.join(" AND ")} `;
    } else {
      query += ` WHERE rp.approver IS NOT NULL `;
    }

    query += ` ORDER BY rp.namalengkap ASC`;

    const [employees] = await dbAbsensi.query(query, params);

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function fetchEmployeeForEdit(req, res) {
  const { regnum } = req.params;
  try {
    const [[employee]] = await dbAbsensi.query(
      `SELECT * FROM reg_person
      WHERE regnum = ?`,
      [regnum],
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee tidak ditemukan" });
    }

    let leaveData = null;

    if (employee.mulai_kerja) {
      const [[quota]] = await dbAbsensi.query(
        `SELECT * FROM t_leave_quota 
        WHERE regnum = ? 
        AND year = YEAR(?)
        ORDER BY id DESC
        LIMIT 1`,
        [regnum, employee.mulai_kerja],
      );

      leaveData = quota || null;
    }

    const today = formatLocalDate(new Date());
    const disableCuti =
      !leaveData?.effective_date || today >= leaveData?.effective_date;

    res.json({ ...employee, ...leaveData, disableCuti });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function editEmployee(req, res) {
  const conn = await dbAbsensi.getConnection();

  try {
    const {
      nama,
      nik,
      tempatLahir,
      tanggalLahir,
      perusahaan,
      divisi,
      departemen,
      jabatan,
      lantai,
      approver,
      mulaiKerja,
      mulaiCuti,
      overtimeEnabled,
      idCuti,
    } = req.body;
    const { regnum } = req.params;

    await conn.beginTransaction();

    await conn.query(
      `
      UPDATE reg_person SET namalengkap = ?, nik = ?, tempat_lahir = ?, tanggal_lahir = ?, mulai_kerja = ?, company_id = ?, divisi_id = ?, departemen_id = ?, jabatan_id = ?, floor_id = ?, approver = ?, is_overtime_enabled = ? WHERE regnum = ?`,
      [
        nama,
        nik,
        tempatLahir,
        tanggalLahir,
        mulaiKerja,
        perusahaan,
        divisi,
        departemen,
        jabatan,
        lantai,
        approver,
        overtimeEnabled,
        regnum,
      ],
    );

    if (mulaiCuti && idCuti) {
      const [result] = await conn.query(
        `
        UPDATE t_leave_quota SET effective_date = ?
        WHERE regnum = ? AND id = ?`,
        [mulaiCuti, regnum, idCuti],
      );

      if (result.affectedRows === 0) {
        throw new Error("Data quota cuti tidak ditemukan");
      }
    }

    await conn.commit();
    res.status(200).json({ message: "Success!" });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
}
