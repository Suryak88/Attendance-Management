import axios from "axios";
import { getValidHadirrToken } from "./authHadirr.js";

export async function fetchCollectorAttendance(date, group) {
  const token = await getValidHadirrToken(group);

  const response = await axios.get(
    "https://developer.hadirr.com/v0/clientvisits",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        date,
      },
    },
  );
  const grouped = new Map();

  for (const visit of response.data.data.list) {
    const nik = visit.id_karyawan;

    if (!grouped.has(nik)) {
      grouped.set(nik, []);
    }

    grouped.get(nik).push(visit);
  }

  const normalized = [];

  for (const [nik, visits] of grouped.entries()) {
    const clockIn = visits
      .map((v) => v.visit_in)
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))[0];

    const sameDayVisitOuts = visits
      .filter((v) => v.visit_out && v.visit_out.slice(0, 10) === date)
      .map((v) => v.visit_out);

    const clockOut = sameDayVisitOuts
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))
      .at(-1);

    normalized.push({
      nik,
      date,
      clock_in: clockIn,
      clock_out: clockOut,
    });
  }

  return {
    data: {
      list: normalized,
    },
  };
}
