import { useState, useEffect } from "react";
import api from "../../utils/axiosInstance";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  formatDateIndo,
  formatLocalDate,
  formatMySQLTime,
  minuteConvert,
} from "../../utils/Date";
import { toast } from "sonner";
import HeadPage from "../../components/organisms/HeadPage";
import TableChild from "../../components/atoms/TableChild";
import { approvalStatusConfig } from "../../utils/statusColor";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import colors from "tailwindcss/colors";
import { useNavigate } from "react-router-dom";
import { CalendarFold, Clock7 } from "lucide-react";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [late, setLate] = useState(0);
  const [cutiDetail, setCutiDetail] = useState([]);
  const [overtime, setOvertime] = useState([]);
  const displayData = overtime.slice(0, 2);
  const hasMore = overtime.length > 2;
  const leaveQuota = cutiDetail.reduce(
    (acc, item) => acc + Number(item.quota || 0),
    0,
  );
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lateHours = Math.floor(late / 60);
  const formattedLate = minuteConvert(late);
  const {
    loading: loadingCuti,
    startLoading: startLoadingCuti,
    stopLoading: stopLoadingCuti,
  } = useDelayedLoading();
  const {
    loading: loadingTelat,
    startLoading: startLoadingTelat,
    stopLoading: stopLoadingTelat,
  } = useDelayedLoading();
  const {
    loading: loadingOvertime,
    startLoading: startLoadingOvertime,
    stopLoading: stopLoadingOvertime,
  } = useDelayedLoading();
  const skeletonLoop = Array.from({ length: 2 });
  const navigate = useNavigate();

  const maxHours = 8;
  const progress = Math.min(lateHours / maxHours, 1);
  const getColor = () => {
    if (late === 0) colors.green[300];
    if (lateHours < 6) return "#fcd34d";
    if (lateHours >= 6) return "#ef4444";

    const red = Math.floor((lateHours / 6) * 255);
    const green = Math.floor(255 - (lateHours / 6) * 255);
    return `rgb(${red},${green},0)`;
  };
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  useEffect(() => {
    if (!user) return;
    fetchLog();
    fetchLeaveQuota();
    fetchOvertime();
  }, [user]);

  async function fetchLog() {
    startLoadingTelat();
    const params = new URLSearchParams({
      startDate: formatLocalDate(firstDay),
      endDate: formatLocalDate(today),
      status: "2",
    });

    await api
      .get(`/attendanceLog/log?${params.toString()}`)
      .then((res) => {
        const totalTelat = res.data
          .filter((late) => late.late_excused === 0)
          .reduce((sum, row) => sum + row.telat, 0);
        setLate(totalTelat);
      })
      .catch((error) =>
        toast.error(
          error?.response?.data?.message || "Failed to fetch late data!",
        ),
      )
      .finally(() => stopLoadingTelat());
  }

  async function fetchLeaveQuota() {
    startLoadingCuti();
    await api
      .get("/leaveRequest/quota")
      .then((res) => {
        setCutiDetail(res.data);
      })
      .catch((error) => console.error(error))
      .finally(() => stopLoadingCuti());
  }

  async function fetchOvertime() {
    startLoadingOvertime();
    await api
      .get("/overtime/", {
        params: {
          startDate: formatLocalDate(firstDay),
          endDate: formatLocalDate(today),
          limit: 3,
        },
      })
      .then((res) => {
        setOvertime(res.data);
      })
      .catch((error) => console.error(error))
      .finally(() => stopLoadingOvertime());
  }

  return (
    <>
      {/* <div className="flex flex-1 justify-between min-h-0 rounded-xl shadow-md bg-black/20"> */}
      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 rounded-xl">
        {/* <div className="p-2 rounded-xl bg-slate-100 h-fit"> */}
        <div className="p-2 rounded-xl bg-slate-100 col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 h-fit transition-all shadow-md">
          <div className="flex flex-1 flex-col gap-2 py-1 my-1 text-xs">
            <div className="flex flex-1 rounded-xl p-1 outline-1 outline-slate-400 shadow-sm">
              <TableChild>Cuti</TableChild>
              <TableChild>Kuota</TableChild>
              <TableChild flexSize="flex-2">Expired</TableChild>
            </div>
            {cutiDetail.length === 0 && !loadingCuti && (
              <div className="flex flex-1 justify-center">
                <p>No Data</p>
              </div>
            )}
            {loadingCuti
              ? skeletonLoop.map((m, index) => (
                  <div
                    key={index}
                    className="skeleton text-transparent flex flex-1 rounded-2xl bg-slate-200"
                  >
                    <p>Loading</p>
                  </div>
                ))
              : cutiDetail.map((cuti) => (
                  <div
                    className="flex flex-1 gap-1 p-1 rounded-xl"
                    key={cuti.id}
                  >
                    <TableChild>{cuti.year}</TableChild>
                    <TableChild>{cuti.quota}</TableChild>
                    <TableChild flexSize="flex-2">
                      {formatDateIndo(cuti.expired_at)}
                    </TableChild>
                  </div>
                ))}
            {cutiDetail.length > 0 && (
              <>
                <hr className="text-slate-500" />
                <p className="px-2 font-medium text-sm">
                  Total Kuota Cuti: {leaveQuota}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="row-span-2 rounded-xl p-2 text-sm col-span-1 md:col-span-2 h-fit bg-slate-100 transition-all shadow-md">
          <p>Total time late (this month):</p>
          {loadingTelat ? (
            <>
              <div className="text-transparent skeleton text-xl self-center rounded-2xl bg-slate-200">
                loading
              </div>
              <svg
                height={radius * 2}
                width={radius * 2}
                className="my-2 mx-auto animate-spin"
              >
                <circle
                  stroke="#e2e8f0"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  stroke="#f1f5f9"
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray="100"
                  strokeDashoffset="60"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  strokeLinecap="round"
                />
              </svg>
            </>
          ) : (
            <>
              <span className="text-xl self-center">{late} minutes</span>
              <svg
                height={radius * 2}
                width={radius * 2}
                className="my-2 mx-auto"
              >
                <circle
                  stroke="#ddd"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  stroke={getColor()}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + " " + circumference}
                  style={{
                    strokeDashoffset,
                    transition: "stroke-dashoffset 0.5s ease",
                  }}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${radius} ${radius})`}
                />
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="text-xl font-bold"
                >
                  {formattedLate}
                </text>
              </svg>
            </>
          )}
        </div>

        <div className="rounded-xl p-2 text-sm col-span-1 md:col-span-2 xl:col-span-2 bg-slate-100 shadow-md">
          <h3 className="font-medium p-1 text-center">Overtime/Lembur</h3>
          <hr className="text-slate-400" />
          <div className="flex flex-wrap justify-evenly gap-2 pt-2">
            {overtime.length === 0 && !loadingOvertime && (
              <div className="flex w-full justify-center text-center">
                <p>No overtime detected</p>
              </div>
            )}
            {loadingOvertime ? (
              <div className="text-transparent flex flex-col flex-1 p-2 gap-3 shadow-sm bg-slate-100 outline-1 outline-slate-300 rounded-xl">
                <div className="flex justify-between">
                  <div className="skeleton flex gap-1 rounded-2xl px-2 bg-slate-200">
                    <p>loading</p>
                  </div>

                  <div
                    className={`skeleton w-fit px-1 rounded-full text-xs h-fit mt-0.5 bg-slate-200`}
                  >
                    <p>loading</p>
                  </div>
                </div>
                <div className="skeleton rounded-2xl px-2 flex bg-slate-200">
                  <div className="flex gap-1">
                    <p>loading</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col flex-1 gap-2">
                  {displayData.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-col flex-1 p-2 gap-3 shadow-sm bg-slate-100 outline-1 outline-slate-300 rounded-xl"
                    >
                      <div className="flex justify-between">
                        <div className="flex gap-1">
                          {/* <span
                            className={`material-symbols-outlined text-xl! leading-none`}
                          >
                            timelapse
                          </span> */}
                          <span className={`flex items-center justify-center`}>
                            <Clock7 className="size-4.5 lg:size-5 xl:size-6" />
                          </span>
                          <p>{Number(o?.real_hours)}h</p>
                        </div>

                        <div
                          className={`w-fit px-1 rounded-full outline-1 text-xs h-fit mt-0.5 ${approvalStatusConfig[o.fl_approve].badgeClass}`}
                        >
                          <p>{approvalStatusConfig[o?.fl_approve].label}</p>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex gap-1">
                          {/* <span
                            className={`material-symbols-outlined text-xl! leading-none`}
                          >
                            today
                          </span> */}

                          <span className={`flex items-center justify-center`}>
                            <CalendarFold className="size-4.5 lg:size-5 xl:size-6" />
                          </span>
                          <p>{formatDateIndo(o?.tgl)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {overtime.length > 2 && (
                    <div className="flex h-fit justify-center">
                      <button
                        onClick={() => navigate("/app/overtimeRequest")}
                        className="text-xs hover:text-blue-500 cursor-pointer"
                      >
                        Show more →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
