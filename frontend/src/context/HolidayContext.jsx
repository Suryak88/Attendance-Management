import { useContext, useEffect } from "react";
import { useState } from "react";
import { createContext } from "react";
import api from "../utils/axiosInstance";
import { AuthContext } from "./AuthContext";
import { formatLocalDate } from "../utils/Date";

const HolidayContext = createContext();

export function HolidayProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [holidaySet, setHolidaySet] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchYearHoliday() {
      try {
        const year = new Date().getFullYear();

        const res = await api.get(`/holiday/${year}`);
        const holiday = new Set(
          //   res.data.map((item) => item.work_date.split("T")[0]),
          // res.data.map((item) => formatLocalDate(new Date(item.work_date))),
          res.data.map((item) => item.work_date),
        );

        setHolidaySet(holiday);
      } catch (error) {
        console.error("Gagal ambil data libur tahunan", error);
      } finally {
        setLoading(false);
      }
    }

    fetchYearHoliday();
  }, [user]);

  return (
    <HolidayContext.Provider value={{ holidaySet, loading }}>
      {children}
    </HolidayContext.Provider>
  );
}

export function useHoliday() {
  return useContext(HolidayContext);
}
