import dbAbsensi from "../config/dbAbsensi.js";
import { fetchHadirrData } from "../services/Hadirr/fetchHadirrData.js";
import { syncHadirrData } from "../services/Hadirr/syncHadirrData.js";
import { formatLocalDate, getDatesBetween } from "../utils/date.js";

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
