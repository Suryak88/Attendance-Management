import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import { columns } from "../../data/attendanceTableHead";

export default function AttendanceLog() {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [stDate, setStDate] = useState("");
  const [enDate, setEnDate] = useState("");

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    setStDate(formatLocalDate(firstDay));
    setEnDate(formatLocalDate(today));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!stDate || !enDate) return;

    api
      .get(`/attendanceLog/log?startDate=${stDate}&endDate=${enDate}`)
      .then((res) => {
        const formatted = formatting(res.data);
        setLogs(formatted);
      })
      .catch((error) => console.error(error));
  }, [stDate, enDate, user]);

  function formatting(logs) {
    return logs.map((l) => {
      const logDate = new Date(l.asattenddate_rev);
      const isSunday = logDate.getDay() === 0;

      return {
        ...l,
        isSunday,
      };
    });
  }

  function formatDateIndo(date) {
    if (!date) return null;

    const d = new Date(date);

    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatMySQLTime(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toTimeString().split(" ")[0]; // HH:MM:SS
  }

  return (
    <div className="bg-slate-100 flex flex-col flex-1 p-0.5 min-h-0">
      <div className="p-3 font-normal">
        <h3 className="text-xl font-semibold">Attendance Log</h3>
        <div className="mt-5 mb-2 text-base">
          <label htmlFor="startDate" className="text-sm lg:text-base">
            Period:
          </label>
          <input
            type="date"
            id="startDate"
            value={stDate}
            onChange={(e) => setStDate(e.target.value)}
            className="mx-2 text-xs lg:text-sm rounded-md border p-0.5"
          />
          <label htmlFor="endDate" className="text-sm lg:text-base">
            to
          </label>
          <input
            type="date"
            id="endDate"
            value={enDate}
            onChange={(e) => setEnDate(e.target.value)}
            className="mx-2 text-xs lg:text-sm rounded-md border p-0.5"
          />
        </div>
      </div>
      <div className="w-full flex flex-col flex-1 space-y-2 min-h-0">
        <div className="flex bg-red-400 text-white p-2 mx-2 rounded-full font-bold">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`flex-1 text-center text-xs md:text-sm xl:text-base ${
                col.label === "No." ? "flex-[0.2]" : "flex-1"
              }`}
            >
              {col.label}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-auto space-y-2 pb-4">
          {logs.map((log, index) => (
            <div
              key={index}
              className="flex bg-red-100 px-1 py-2 md:p-2 mx-2 rounded-full items-center min-h-0"
            >
              <TableChild nmr="true">{index + 1}</TableChild>
              <TableChild>{log.fullname}</TableChild>
              <TableChild>{formatDateIndo(log.asattenddate_rev)}</TableChild>
              <TableChild telat={log.telat}>
                {formatMySQLTime(log.masuk) ||
                  (log.isSunday ? (
                    "-"
                  ) : (
                    <span className="text-xs lg:text-sm font-semibold text-red-600">
                      {"Missing"}
                    </span>
                  ))}
              </TableChild>
              <TableChild>
                {formatMySQLTime(log.pulang) ||
                  (log.isSunday ? (
                    "-"
                  ) : (
                    <span className="text-xs lg:text-sm font-semibold text-red-600">
                      {"Missing"}
                    </span>
                  ))}
              </TableChild>
              <TableChild></TableChild>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableChild({ children, telat, nmr }) {
  return (
    <div
      className={`text-center text-xs md:text-sm xl:text-base ${
        nmr == "true" ? "flex-[0.2]" : "flex-1"
      } ${telat ? "text-red-600 font-semibold" : ""}`}
    >
      {children}
    </div>
  );
}
