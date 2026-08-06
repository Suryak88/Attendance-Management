import dbAbsensi from "../config/dbAbsensi.js";
import { fetchHadirrData } from "../services/Hadirr/fetchHadirrData.js";
import { syncHadirrData } from "../services/Hadirr/syncHadirrData.js";
import {
  formatDateIndo,
  formatLocalDate,
  getDatesBetween,
  isoUtcToMySQLLocal,
} from "../utils/date.js";

export async function updateDataHadirr(req, res) {
  try {
    const { startDate, endDate, group } = req.query;
    let totalInserted = 0;
    const failedDates = [];
    const dates = getDatesBetween(startDate, endDate);

    for (const date of dates) {
      const conn = await dbAbsensi.getConnection();

      try {
        await conn.beginTransaction();
        const result = await syncHadirrData(conn, date, group);
        await conn.commit();
        totalInserted += result.inserted;
      } catch (error) {
        await conn.rollback();
        failedDates.push({
          date,
          message: error.message,
        });
      } finally {
        conn.release();
      }
    }
    res.json({
      message: "Sync Hadir success",
      totalDates: dates.length,
      inserted: totalInserted,
      failedDates,
    });
  } catch (error) {
    console.log(error.response?.data);
    res.status(500).json({ message: error.message });
  }
}

export async function syncCuti(req, res) {
  try {
    const { startDate, endDate } = req.query;
    let totalInserted = 0;
    const failedDates = [];
    const dates = getDatesBetween(startDate, endDate);

    for (const date of dates) {
      const conn = await dbAbsensi.getConnection();

      try {
        await conn.beginTransaction();

        const hadirrData = await fetchHadirrData(date, "SALES");
        const values = [];
        const [mappings] = await conn.query(
          `SELECT 
            rpas.hadir_nik, rp.regnum, rp.namalengkap
            FROM reg_person_attendance_source rpas 
            JOIN reg_person rp 
              ON rp.regnum = rpas.regnum
            WHERE rpas.source_type = 'HADIRR' AND rpas.source_name = "SALES"
            `,
        );

        const employeeMap = new Map();

        for (const m of mappings) {
          employeeMap.set(m.hadir_nik, {
            regnum: m.regnum,
            fullname: m.namalengkap,
          });
        }

        for (const log of hadirrData.data.list) {
          const employee = employeeMap.get(log.nik);

          if (!employee) {
            console.log(`No mapping for Hadirr NIK: ${log.nik}`);
            continue;
          }

          if (
            (log.status !== "Cuti" && log.status !== "Sakit") ||
            log.group_name === "KEY ACCOUNT MANAGER"
          ) {
            continue;
          }

          const [calendarRows] = await conn.query(
            `SELECT work_date, is_workday
              FROM m_work_calendar 
              WHERE work_date = ?
              AND is_workday = 1`,
            [log.date],
          );

          if (calendarRows.length === 0) {
            console.log(
              `Tanggal bukan hari kerja: ${log.date} untuk ${log.name}`,
            );
            continue;
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
            [employee.regnum, log.date, log.date, log.date, log.date, log.date],
          );

          if (overlap.total > 0) {
            console.log(
              `Duplicate: Sudah terdapat request ${log.date} untuk ${log.name}`,
            );
            continue;
          }

          const [conflicts] = await conn.query(
            `SELECT asattenddate_rev 
              FROM t_absensi 
              WHERE regnum = ? 
              AND asattenddate_rev = ?
              AND checkdatetime_rev IS NOT NULL
              FOR UPDATE`,
            [employee.regnum, log.date],
          );

          if (conflicts.length > 0) {
            console.log(
              `Konflik: Sudah terdapat absensi pada ${log.date} untuk ${log.name}`,
            );
            continue;
          }

          if (log.status === "Cuti") {
            const [quotas] = await conn.query(
              `SELECT *
                FROM t_leave_quota
                WHERE regnum = ? 
                AND effective_date <= ?
                AND expired_at >= ?
                ORDER BY expired_at ASC FOR UPDATE`,
              [employee.regnum, log.date, log.date],
            );

            if (!quotas.length) {
              console.log(
                `${log.name} Tidak memiliki jatah cuti tahunan untuk ${log.date}`,
              );
              continue;
            }

            let quotaClone = quotas.map((q) => ({ ...q }));

            const q = quotaClone.find((x) => {
              const initialDate = new Date(x.effective_date);
              const lastDate = new Date(x.expired_at);
              const date = new Date(log.date);
              return x.quota > 0 && date >= initialDate && date <= lastDate;
            });

            if (!q) {
              console.log(
                `Quota ${log.name} tidak mencukupi pada ${formatDateIndo(log.date)}`,
              );
              continue;
            }

            const [result] = await conn.query(
              `INSERT INTO t_leave
                (regnum, fullname, tgl1, tgl2, leave_id, keterangan, entry_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                employee.regnum,
                employee.fullname,
                log.date,
                log.date,
                3,
                "Cuti",
                8,
              ],
            );

            const leaveId = result.insertId;

            await conn.query(
              `UPDATE t_leave SET fl_approve = 1, approved_by = ?, approved_log = NOW() WHERE id = ?`,
              [8, leaveId],
            );

            await conn.query(
              `UPDATE t_leave_quota SET quota = quota - 1 WHERE id = ? AND quota > 0`,
              [q.id],
            );

            await conn.query(
              `INSERT INTO t_leave_usage
                (leave_request_id, leave_quota_id, leave_date, days)
                VALUES (?, ?, ?, 1)`,
              [leaveId, q.id, log.date],
            );

            totalInserted += 1;
          } else if (log.status === "Sakit") {
            const [result] = await conn.query(
              `INSERT INTO t_leave
                (regnum, fullname, tgl1, tgl2, leave_id, keterangan, entry_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                employee.regnum,
                employee.fullname,
                log.date,
                log.date,
                1,
                "Sakit",
                8,
              ],
            );

            const leaveId = result.insertId;

            await conn.query(
              `UPDATE t_leave SET fl_approve = 1, approved_by = ?, approved_log = NOW() WHERE id = ?`,
              [8, leaveId],
            );

            totalInserted += 1;
          }
        }

        await conn.commit();
      } catch (error) {
        await conn.rollback();
        failedDates.push({
          date,
          message: error.message,
        });
      } finally {
        conn.release();
      }
    }
    res.json({
      message: "Sync Hadir success",
      inserted: totalInserted,
    });
  } catch (error) {
    console.log(error.response?.data);
    res.status(500).json({ message: error.message });
  }
}
