import { useEffect } from "react";
import { useState } from "react";
import api from "../utils/axiosInstance";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useHolidayCalendar(calendarMonth) {
  const { user } = useContext(AuthContext);
  const [holidayDates, setHolidayDates] = useState([]);

  useEffect(() => {
    if (!user) return;

    async function fetchHoliday() {
      const year = calendarMonth.getFullYear();
      const month = String(calendarMonth.getMonth() + 1).padStart(2, "0");
      try {
        await api.get(`/holiday/${year}-${month}`).then((res) => {
          const holiday = res.data.map((item) => {
            const d = new Date(item.work_date);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
          });
          setHolidayDates(holiday);
        });
      } catch (error) {
        console.error("Gagal ambil data libur", error);
      }
    }

    fetchHoliday();
  }, [calendarMonth, user]);

  return holidayDates;
}
