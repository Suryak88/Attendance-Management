import { useContext, useEffect, useRef, useState } from "react";
import Button from "../../components/atoms/Button";
import FloatingDate from "../../components/atoms/FloatingDate";
import { toast } from "sonner";
import {
  formatDateIndo,
  formatLocalDate,
  formatMySQLTime,
  minuteConvert,
} from "../../utils/Date";
import api from "../../utils/axiosInstance";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import HistoryBar from "../../components/organisms/HistoryBar";
import { approvalStatusConfig } from "../../utils/statusColor";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OvertimeChecking() {
  const { user } = useContext(AuthContext);
  const [date, setDate] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [detail, setDetail] = useState([]);
  const [ovtHistory, setOvtHistory] = useState([]);
  const skeletonRows = Array.from({ length: 3 });
  const cekLoader = useDelayedLoading();
  const historyLoader = useDelayedLoading();
  const requestIdRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchOvtHistory();
  }, [user]);

  async function handleCheck(e) {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    const requestId = ++requestIdRef.current;
    cekLoader.startLoading();

    await api
      .get("/overtime/check/", {
        params: {
          date: formatLocalDate(date),
        },
      })
      .then((res) => {
        if (requestId !== requestIdRef.current) return;

        const formatted = formatting(res.data);
        setDetail(formatted);
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Failed to check overtime",
        );
        console.error(error);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) cekLoader.stopLoading();
      });
  }

  function formatting(data) {
    return data.map((d) => {
      const status = d.is_overtime_eligible
        ? "Berhak mendapatkan lembur"
        : "Belum berhak mendapatkan lembur";
      const timeToOvertime = Math.abs(d.raw_minutes);
      return {
        ...d,
        status,
        timeToOvertime,
      };
    });
  }

  async function fetchOvtHistory() {
    historyLoader.startLoading();
    await api
      .get("/overtime/", {
        params: {
          limit: 10,
        },
      })
      .then((res) => {
        setOvtHistory(res.data);
      })
      .catch((error) => console.error(error))
      .finally(historyLoader.stopLoading);
  }

  return (
    <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0 overflow-auto scrollbar-hidden ">
      <div className="p-3 font-normal">
        <h3 className="text-xl md:text-2xl font-medium">Overtime</h3>
      </div>

      <div
        className={`h-103 flex flex-col p-2 my-3 mx-4 rounded-2xl bg-slate-100 outline-1 outline-slate-400 shadow-sm transition-all duration-300
            md:max-w-md md:mx-auto md:min-h-[420px]
            lg:mx-4 `}
      >
        <h3>Overtime Checking</h3>
        <div className="flex gap-3 px-5 mt-3">
          <FloatingDate
            id="cekDate"
            label={"Date"}
            message={"Please enter valid date"}
            selectedDate={date}
            setSelectedDate={setDate}
            displayValue={displayDate}
            setDisplayValue={setDisplayDate}
            border="border"
            fontThickness="font-normal"
          />
          <div className="flex mb-4 lg:mb-6 items-center">
            <Button btnLabel={"Check"} handleClick={handleCheck} btnWidth="" />
          </div>
        </div>

        {detail.length === 0 && !cekLoader.loading && (
          <div className="flex flex-col flex-1 justify-center items-center">
            <p className="text-sm text-center">
              Overtime is detected automatically by the system. <br />
              Select a date and tap <span className="font-medium">
                "Check"
              </span>{" "}
              <br />
              to view the details.
            </p>
          </div>
        )}

        {cekLoader.loading ? (
          <div className={`text-transparent `}>
            <hr className="text-slate-400" />
            <div className="flex flex-col flex-1 p-3 mt-5 mb-3 mx-2 justify-center outline-1 outline-slate-400 rounded-xl bg-slate-100 shadow-sm space-y-1">
              <p
                className={`skeleton font-medium text-center bg-slate-200 rounded-2xl`}
              >
                Loading
              </p>
              <hr className="my-2 text-slate-400" />
              <div className="skeleton flex flex-1 mt-3 mb-1 text-sm bg-slate-200 rounded-2xl">
                <p>Loading</p>
              </div>
              <div className="flex flex-1 gap-3 mt-1 mb-3">
                <div className="skeleton flex flex-col flex-1 outline-1 outline-slate-300 bg-slate-200 p-2 rounded-xl shadow-sm">
                  <p className="font-medium text-sm text-left">Clock-in</p>
                  <p className={`font-medium text-lg text-right `}>loading</p>
                </div>
                <div className="skeleton flex flex-col flex-1 outline-1 outline-slate-300 bg-slate-200 p-2 rounded-xl">
                  <p className="font-medium text-sm text-left">Clock-out</p>
                  <p className={`font-medium text-lg text-right `}>loading</p>
                </div>
              </div>
              <div className="skeleton flex flex-1 text-sm bg-slate-200 rounded-2xl">
                <p>Loading</p>
              </div>
              <div className="skeleton flex flex-1 text-sm bg-slate-200 rounded-2xl">
                <p>Loading</p>
              </div>
            </div>
          </div>
        ) : (
          detail.map((d, index) => {
            return (
              <div key={index}>
                <hr className="text-slate-400" />
                <div className="flex flex-col flex-1 p-3 mt-5 mb-3 mx-2 justify-center outline-1 outline-slate-400 rounded-xl bg-slate-100 shadow-md space-y-1">
                  <p
                    className={`font-medium text-center ${d?.is_overtime_eligible ? "text-blue-700" : "text-red-700"}`}
                  >
                    {d?.status}
                  </p>
                  <hr className="my-2 text-slate-400" />
                  <div className="flex flex-1 mt-3 mb-1 text-sm ">
                    <p>{formatDateIndo(d?.asattenddate_rev, "long")}</p>
                  </div>
                  {d?.is_workday === 0 && (
                    <>
                      {d?.checkin || d?.checkout ? (
                        <>
                          <div className="flex flex-1 gap-3">
                            <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                              <p className="font-medium text-sm text-left text-slate-600">
                                Clock-in
                              </p>
                              <p
                                className={`font-medium text-lg text-right ${!d?.checkin || d?.telat ? "text-red-600" : "text-black"}`}
                              >
                                {formatMySQLTime(d?.checkin) || "Missing"}
                              </p>
                            </div>
                            <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                              <p className="font-medium text-sm text-left text-slate-600">
                                Clock-out
                              </p>
                              <p
                                className={`font-medium text-lg text-right ${!d?.checkout || d?.pulang_cepat ? "text-red-600" : "text-black"}`}
                              >
                                {formatMySQLTime(d?.checkout) || "Missing"}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-1 justify-center py-4 outline-1 outline-red-400 bg-red-200 rounded-xl">
                          <p className="font-medium text-base">
                            {d?.description}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {d?.is_workday === 1 && (
                    <>
                      {d.attendance_status === 0 && (
                        <div className="flex flex-1 gap-3 mb-2">
                          <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl shadow-sm">
                            <p className="font-medium text-sm text-left text-slate-600">
                              Clock-in
                            </p>
                            <p
                              className={`font-medium text-lg text-right ${!d?.checkin || d?.telat ? "text-red-600" : "text-black"}`}
                            >
                              {formatMySQLTime(d?.checkin) || "Missing"}
                            </p>
                          </div>
                          <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                            <p className="font-medium text-sm text-left text-slate-600">
                              Clock-out
                            </p>
                            <p
                              className={`font-medium text-lg text-right ${!d?.checkout || d?.pulang_cepat ? "text-red-600" : "text-black"}`}
                            >
                              {formatMySQLTime(d?.checkout) || "Missing"}
                            </p>
                          </div>
                        </div>
                      )}
                      {d.attendance_status === 1 && (
                        <div className="flex flex-col flex-1 text-center outline-1 outline-slate-400 bg-slate-200 py-3 rounded-xl">
                          <p className="font-medium text-base">
                            {d.leave_name}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {d?.telat > 0 && (
                    <div className="flex flex-1 justify-between text-sm ">
                      <p>Late</p>
                      <p>{minuteConvert(d?.telat)}</p>
                    </div>
                  )}
                  {d?.overtime_start && (
                    <div className="flex flex-1 justify-between text-sm">
                      <p>Start Overtime</p>
                      <p>{formatMySQLTime(d.overtime_start) || "-"}</p>
                    </div>
                  )}
                  {d?.raw_minutes < 0 && (
                    <div className="flex flex-1 justify-between text-sm">
                      <p>Time Remaining to Overtime</p>
                      <p>{minuteConvert(d.timeToOvertime) || "-"}</p>
                    </div>
                  )}
                  {d?.is_overtime_eligible === 1 && d?.durasi_asli > 0 && (
                    <div className="flex flex-1 justify-between text-sm">
                      <p>Overtime Duration</p>
                      <p>{Number(d.durasi_asli)}h</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <HistoryBar>
        <div className="flex flex-1 gap-5 items-center">
          {ovtHistory.length < 1 && !historyLoader.loading && (
            <div className="flex flex-1 justify-center items-center text-sm text-center ">
              <p className="font-medium">No Data</p>
            </div>
          )}
          {historyLoader.loading
            ? skeletonRows.map((index) => (
                <div
                  key={index}
                  className="text-transparent flex flex-col w-55 lg:w-65 h-fit rounded-xl p-2 outline outline-slate-400 shadow-sm"
                >
                  <div className="flex py-1 justify-between items-center">
                    <div className="skeleton bg-slate-200 rounded-2xl px-2">
                      Loading
                    </div>
                    <div className="flex items-center justify-end">
                      <div
                        className={`skeleton bg-slate-200 px-1.5 py-0.5 mt-1 rounded-full text-xs h-fit`}
                      >
                        Loading
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 my-2 lg:mb-1.5">
                    <div className="skeleton bg-slate-200 flex justify-evenly w-full rounded-xl p-2 gap-2 outline-1 outline-slate-300 shadow-sm font-medium text-[13px] text-center lg:text-base">
                      <div className="flex flex-col">
                        <p className="text-xs">Loading</p>
                        <p>Loading</p>
                      </div>
                    </div>
                    <div className="skeleton rounded-2xl bg-slate-200 flex mt-2 text-xs">
                      <p>Loading</p>
                    </div>
                    <div className="skeleton rounded-2xl bg-slate-200 flex text-xs">
                      <p>Loading</p>
                    </div>
                    <hr className="text-slate-200 my-1" />
                    <div className="skeleton rounded-2xl bg-slate-200 flex text-xs">
                      <p>Loading</p>
                    </div>
                  </div>
                </div>
              ))
            : ovtHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col w-55 lg:w-65 h-fit rounded-xl p-2 outline outline-slate-400 shadow-sm"
                >
                  <div className="flex py-1 justify-between items-center">
                    <div className="">Lembur</div>
                    <div className="flex items-center justify-end">
                      <div
                        className={`px-1.5 py-0.5 mt-1 rounded-full outline-1 text-xs h-fit ${
                          approvalStatusConfig[item?.fl_approve]?.badgeClass ??
                          ""
                        }`}
                      >
                        {approvalStatusConfig[item?.fl_approve]?.label ?? ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 my-2 lg:mb-1.5">
                    <div className="flex justify-evenly w-full rounded-xl p-2 gap-2 outline-1 outline-slate-400 shadow-sm font-medium text-[13px] text-center lg:text-base">
                      <div className="flex flex-col">
                        <p className="text-xs text-slate-500">Duration</p>
                        <p>
                          {item?.real_hours
                            ? `${Number(item?.real_hours)} Jam`
                            : `-`}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs text-slate-500">Date</p>
                        <p>{formatDateIndo(item?.tgl, "short")}</p>
                      </div>
                    </div>
                    <div className="flex mt-2 justify-between text-xs">
                      <p>Clock In</p>
                      <p>
                        {item?.masuk ? `${formatMySQLTime(item?.masuk)}` : `-`}
                      </p>
                    </div>
                    {item.telat > 0 && (
                      <div className="flex justify-between text-xs">
                        <p>Late</p>
                        <p>{minuteConvert(item?.telat)}</p>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <p>Clock Out</p>
                      <p>
                        {item?.pulang
                          ? `${formatMySQLTime(item?.pulang)}`
                          : `-`}
                      </p>
                    </div>
                    <div className="flex justify-between text-xs gap-10">
                      <p>Desc</p>
                      <p className="text-right">{item?.keterangan}</p>
                    </div>
                    {item.rejection_notes && (
                      <div className="flex gap-10 justify-between text-xs">
                        <p>Notes</p>
                        <p className="text-right">
                          {item?.rejection_notes ?? "-"}
                        </p>
                      </div>
                    )}
                    <hr className="text-slate-400 shadow-sm" />
                    <div className="flex justify-between text-xs font-medium">
                      <p>Status:</p>
                      <p>{item?.overtime_status_formatted}</p>
                    </div>
                  </div>
                  <div className={`flex justify-center mt-2 gap-2`}>
                    {item.overtime_status === "NEED_DESCRIPTION" && (
                      <Button
                        btnLabel="Input Description"
                        btnWidth=""
                        btnColor="outline-1 outline-slate-400 hover:outline-slate-600 hover:text-black/60!"
                        textSize="text-xs shadow-sm!"
                        handleClick={() => {
                          navigate("/app/overtimeRequest", {
                            state: { date: item?.tgl },
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
        </div>
      </HistoryBar>
    </div>
  );
}
