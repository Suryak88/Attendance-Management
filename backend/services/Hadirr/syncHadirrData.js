import { fetchHadirrData } from "./fetchHadirrData.js";

export async function syncHadirrData(conn, date, group) {
  const hadirrData = await fetchHadirrData(date, group);
  const values = [];
  const [mappings] = await conn.query(
    `SELECT 
    rpas.hadir_nik, rp.regnum, rp.namalengkap
    FROM reg_person_attendance_source rpas 
    JOIN reg_person rp 
      ON rp.regnum = rpas.regnum
    WHERE rpas.source_type = 'HADIRR' AND rpas.source_name = ?
    `,
    [group],
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

    if (log.clock_in) {
      values.push([
        employee.regnum,
        employee.fullname,
        0,
        log.date,
        log.clock_in,
        "HADIRR",
      ]);
    }

    if (log.clock_out) {
      values.push([
        employee.regnum,
        employee.fullname,
        1,
        log.date,
        log.clock_out,
        "HADIRR",
      ]);
    }
  }

  if (values.length > 0) {
    await conn.query(
      `INSERT IGNORE INTO rec_checkdt
        (regnum, fullname, checkcode, asattenddate, checkdatetime, source)
        VALUES ?`,
      [values],
    );
  }

  return {
    total: hadirrData.data.total,
    inserted: values.length,
  };
}
