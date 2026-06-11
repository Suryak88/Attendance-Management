import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import { columns } from "../../data/attendanceTableHead";
import TableChild from "../../components/atoms/TableChild";
import {
  formatDateFromPicker,
  formatDateIndo,
  formatLocalDate,
  formatMySQLTime,
  isoUtcToMySQLLocal,
  isoUTCToTime,
} from "../../utils/Date";
import PopUpMenu from "../../components/organisms/PopUpMenu";
import { truncateText } from "../../utils/truncateText";
import SidebarButton from "../../components/atoms/SidebarButton";
import { useNavigate } from "react-router-dom";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import Button from "../../components/atoms/Button";
import { attendanceLogStatusOptions } from "../../data/attendanceLogStatusOptions";
import FilterPopup from "../../components/organisms/FilterPopUp";
import FilterDate from "../../components/organisms/FilterPopUp/contents/FilterDate";
import FilterSelect from "../../components/organisms/FilterPopUp/contents/FIlterSelect";
import Modal from "../../components/organisms/Modal";
import { useModal } from "../../hooks/useModal";
import { approvalStatusConfig } from "../../utils/statusColor";
import { useFilter } from "../../hooks/useFilter";
import HeadPage from "../../components/organisms/HeadPage";
import { quickFilterAttendanceLog } from "../../data/quickFIlterAttendanceLog";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import { enrichCorrection } from "../../utils/correctionFormatter";
import { EllipsisVertical } from "lucide-react";

export default function AttendanceLog() {
  const { user, subordinates } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [displayStDate, setDisplayStDate] = useState("");
  const [displayEnDate, setDisplayEnDate] = useState("");
  const [rowPopup, setRowPopup] = useState(null);
  const [rowPopupOpen, setRowPopupOpen] = useState(false);
  const [filterPopup, setFilterPopup] = useState(null);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const navigate = useNavigate();
  const subordinate = subordinates.map((s) => ({
    label: s.namalengkap.trim(),
    value: s.regnum,
  }));
  const employeeOptions = [{ label: "All", value: "all" }, ...subordinate];
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const { open, close, openModal } = useModal(resetForm);
  const [selectedLog, setSelectedLog] = useState(null);
  const STORAGE_KEY = "attendance-log-filter";
  const savedFilter = sessionStorage.getItem(STORAGE_KEY);
  const defaultFilter = {
    startDate: firstDay,
    endDate: today,
    employee: user?.regnum,
    status: "0",
  };
  const initialFilter = savedFilter
    ? {
        ...JSON.parse(savedFilter),
        startDate: new Date(JSON.parse(savedFilter).startDate),
        endDate: new Date(JSON.parse(savedFilter).endDate),
      }
    : defaultFilter;

  const {
    draftFilter,
    activeFilter,
    setField,
    applyFilter,
    resetFilter,
    syncDraftWithActive,
    setActiveFilter,
    setDraftFilter,
  } = useFilter(initialFilter);
  const activeEmployee = employeeOptions.find(
    (s) => s.value === activeFilter.employee,
  );
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const skeletonRows = Array.from({ length: 5 });
  const { loading, startLoading, stopLoading } = useDelayedLoading();
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    setDisplayStDate(formatDateFromPicker(firstDay));
    setDisplayEnDate(formatDateFromPicker(today));
  }, [user]);

  useEffect(() => {
    if (!user || !activeFilter.startDate || !activeFilter.endDate) return;
    const requestId = ++requestIdRef.current;
    startLoading();

    const params = new URLSearchParams({
      startDate: formatLocalDate(activeFilter.startDate),
      endDate: formatLocalDate(activeFilter.endDate),
      status: activeFilter.status,
    });

    if (activeFilter.employee)
      params.append("targetRegnum", activeFilter.employee);

    api
      .get(`/attendanceLog/log?${params.toString()}`)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;

        const formatted = formatting(res.data);
        setLogs(formatted);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (requestId === requestIdRef.current) stopLoading();
      });
  }, [user, activeFilter]);

  function formatting(logs) {
    return logs.map((l) => {
      const enrichedData = enrichCorrection(l);
      const status = l.status_koreksi ?? l.status_leave;
      const durasi_lembur = Number(l.durasi_lembur);
      return {
        ...enrichedData,
        status,
        durasi_lembur,
      };
    });
  }

  useEffect(() => {
    if (!rowPopup) return;

    const handleScroll = () => handleCloseRowPopup();

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [rowPopup]);

  useEffect(() => {
    if (!draftFilter.startDate || !draftFilter.endDate) return;
    const filters = quickFilterAttendanceLog.map((m) => ({
      id: m.id,
      ...m.getFilter(),
    }));

    const match = filters.find((q) => {
      return (
        formatLocalDate(q.startDate) ===
          formatLocalDate(draftFilter.startDate) &&
        formatLocalDate(q.endDate) === formatLocalDate(draftFilter.endDate) &&
        q.employee === draftFilter.employee &&
        q.status === draftFilter.status
      );
    });

    setActiveQuickFilter(match ? match.id : null);
  }, [draftFilter]);

  function handleCloseRowPopup() {
    setRowPopupOpen(false);
    setTimeout(() => {
      setRowPopup(null);
    }, 200);
  }

  function handleCloseFilter() {
    setFilterPopupOpen(false);
    setTimeout(() => {
      setFilterPopup(null);
      setActiveQuickFilter(null);
    }, 200);
  }

  function getCorrectionAction(log) {
    if (!log.masuk && !log.pulang && log.is_workday === 1) {
      return { type: "leave" };
    }

    if (!log.masuk || !log.pulang || log.telat > 0 || log.pulang_cepat > 0) {
      return { type: "attendance" };
    }

    return { type: "none" };
  }

  // button popup
  function handleClick() {
    if (!rowPopup) return;

    const action = getCorrectionAction(rowPopup.log);

    if (action.type === "leave") {
      navigate("/app/leaveRequest", {
        state: { date: rowPopup.log.asattenddate_rev },
      });
    }

    if (action.type === "attendance") {
      navigate("/app/attendanceCorrection/", {
        state: { date: rowPopup.log.asattenddate_rev },
      });
    }
  }

  function handleClickMoreRow(e, index, log) {
    e.stopPropagation();
    if (rowPopup?.index === index) {
      handleCloseRowPopup();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    setRowPopup({
      index,
      log,
      rect,
    });
    setRowPopupOpen(false);

    requestAnimationFrame(() => {
      setRowPopupOpen(true);
    });
  }

  function handleClickFilter(e) {
    e.stopPropagation();

    if (filterPopupOpen) {
      handleCloseFilter();
      return;
    }
    syncDraftWithActive();
    setDisplayStDate(formatDateFromPicker(activeFilter.startDate));
    setDisplayEnDate(formatDateFromPicker(activeFilter.endDate));

    const rect = e.currentTarget.getBoundingClientRect();

    setFilterPopup({
      rect,
    });
    setFilterPopupOpen(false);

    requestAnimationFrame(() => {
      setFilterPopupOpen(true);
    });
  }

  function handleResetFilter() {
    // resetFilter();
    setDraftFilter(defaultFilter);
    setDisplayStDate(formatDateFromPicker(firstDay));
    setDisplayEnDate(formatDateFromPicker(today));
  }

  function handleApplyFilter() {
    applyFilter();

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draftFilter));
  }

  function resetForm() {}

  function handleCloseModal() {
    close();
    setTimeout(() => {
      resetForm();
    }, 300);
  }

  function overWrite(log) {
    if (!log || log.regnum !== user?.regnum) return false;

    const isWorkingDay = log.is_workday === 1;
    const status = log.attendance_status === 0;

    const missingClockIn = isWorkingDay && !log.masuk && status;
    const missingClockOut = isWorkingDay && !log.pulang && status;
    const lateWithoutReason = log.telat > 0 && !log.keterangan_telat;
    const earlyLeaveWithoutReason =
      log.pulang_cepat > 0 && !log.keterangan_telat;

    return (
      missingClockIn ||
      missingClockOut ||
      lateWithoutReason ||
      earlyLeaveWithoutReason
    );
  }

  function overWriteLabel(log) {
    const action = getCorrectionAction(log);

    return action.type === "leave" ? "Leave Request" : "Attendance Correction";
  }

  function handleClickQuickFilter(data) {
    const filter = data.getFilter();

    setActiveQuickFilter(data.id);
    setField("startDate", filter.startDate);
    setDisplayStDate(formatDateFromPicker(filter.startDate));
    setField("endDate", filter.endDate);
    setDisplayEnDate(formatDateFromPicker(filter.endDate));
    setField("employee", filter.employee);
    setField("status", filter.status);
  }

  return (
    <div className="bg-slate-100 flex flex-col flex-1 p-0.5 min-h-0">
      <HeadPage
        label={"Attendance Log"}
        employeeName={activeEmployee?.label}
        handleClick={handleClickFilter}
      />

      <div className="w-full flex flex-col flex-1 space-y-2 min-h-0">
        <div className="flex bg-red-400 text-white p-2 mx-2 rounded-2xl font-bold">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`flex-1 text-center text-[13px] md:text-sm xl:text-base ${
                col.narrow ? "flex-[0.2]" : "flex-1"
              }`}
            >
              {col.label}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-auto space-y-2 pb-4">
          {logs.length === 0 && !loading && (
            <div className="font-semibold my-3">
              <TableChild>No Data</TableChild>
            </div>
          )}
          {loading ? (
            <>
              {skeletonRows.map((m, index) => (
                <div
                  key={index}
                  className="skeleton flex bg-red-100 px-1 py-2 md:p-2 mx-2 rounded-2xl items-center min-h-0 animate-pulse select-none"
                >
                  <div className="flex flex-1 animate-pulse rounded-2xl text-transparent select-none">
                    loading
                  </div>
                </div>
              ))}
            </>
          ) : (
            logs.map((log, index) => {
              return (
                <div
                  key={index}
                  className={`flex px-1 py-2 md:p-2 mx-2 rounded-2xl items-center min-h-0 ${log?.final_status === "CONFLICT" ? "bg-red-300" : "bg-red-100"}`}
                >
                  {activeFilter.employee === "all" && (
                    <TableChild>
                      {formatDateIndo(log.asattenddate_rev)}
                      {"/"}
                      {truncateText(log.fullname, 6, false)}
                    </TableChild>
                  )}
                  {activeFilter.employee !== "all" && (
                    <TableChild>
                      <div className="hidden md:flex">
                        {formatDateIndo(log.asattenddate_rev, "long")}
                      </div>
                      <div className="flex md:hidden ">
                        {formatDateIndo(log.asattenddate_rev)}
                      </div>
                    </TableChild>
                  )}
                  {!log.calendar_type && (
                    <TableChild flexSize="flex-2">
                      {"No Calendar Data"}
                    </TableChild>
                  )}
                  {log.is_workday === 0 && (
                    <>
                      {log.masuk || log.pulang ? (
                        <>
                          <TableChild>
                            {log.masuk ? (
                              formatMySQLTime(isoUtcToMySQLLocal(log.masuk))
                            ) : (
                              <span className="text-[13px] lg:text-sm font-semibold text-red-600">
                                {"Missing"}
                              </span>
                            )}
                          </TableChild>
                          <TableChild>
                            {log.pulang ? (
                              formatMySQLTime(isoUtcToMySQLLocal(log.pulang))
                            ) : (
                              <span className="text-[13px] lg:text-sm font-semibold text-red-600">
                                {"Missing"}
                              </span>
                            )}
                          </TableChild>
                        </>
                      ) : (
                        <TableChild flexSize="flex-2">
                          {log.calendar_desc || "Hari Libur"}
                        </TableChild>
                      )}
                    </>
                  )}
                  {log.is_workday === 1 && (
                    <>
                      {log.final_status === "CONFLICT" && (
                        <>
                          <TableChild red={log.telat}>
                            {log.masuk ? (
                              formatMySQLTime(isoUtcToMySQLLocal(log.masuk))
                            ) : (
                              <span className="text-[13px] lg:text-sm font-semibold text-red-600">
                                {"Missing"}
                              </span>
                            )}
                          </TableChild>
                          <TableChild red={log.pulang_cepat}>
                            {log.pulang ? (
                              formatMySQLTime(isoUtcToMySQLLocal(log.pulang))
                            ) : (
                              <span className="text-[13px] lg:text-sm font-semibold text-red-600">
                                {"Missing"}
                              </span>
                            )}
                          </TableChild>
                          <TableChild>
                            <div className="flex items-center">
                              <p>{log.leave_name}</p>
                              <div
                                className={`flex w-fit px-2 py-0.5 ml-2 rounded-full outline-1 text-center text-[10px] md:text-xs xl:text-sm h-fit ${
                                  approvalStatusConfig[log?.status]
                                    ?.badgeClass ?? "outline-none"
                                }`}
                              >
                                {approvalStatusConfig[log?.status]?.label ?? ""}
                              </div>
                            </div>
                          </TableChild>
                        </>
                      )}
                      {log.attendance_status === 0 &&
                        log.final_status !== "CONFLICT" && (
                          <>
                            <TableChild red={log.telat}>
                              {log.masuk ? (
                                formatMySQLTime(isoUtcToMySQLLocal(log.masuk))
                              ) : (
                                <span className="text-[13px] lg:text-sm font-semibold text-red-600">
                                  {"Missing"}
                                </span>
                              )}
                            </TableChild>
                            <TableChild red={log.pulang_cepat}>
                              {log.pulang ? (
                                formatMySQLTime(isoUtcToMySQLLocal(log.pulang))
                              ) : (
                                <span className="text-[13px] lg:text-sm font-semibold text-red-600">
                                  {"Missing"}
                                </span>
                              )}
                            </TableChild>
                          </>
                        )}
                      {log.attendance_status === 1 &&
                        log.final_status !== "CONFLICT" && (
                          <TableChild flexSize="flex-2">
                            {log.leave_name}
                          </TableChild>
                        )}
                    </>
                  )}

                  {log?.final_status !== "CONFLICT" && (
                    <TableChild>
                      <>
                        <div
                          className={`flex w-fit px-2 py-0.5 mt-1 rounded-full outline-1 text-center text-[10px] md:text-xs xl:text-sm h-fit ${
                            approvalStatusConfig[log?.status]?.badgeClass ??
                            "outline-none"
                          }`}
                        >
                          {approvalStatusConfig[log?.status]?.label ?? ""}
                        </div>

                        {log?.durasi_lembur > 0 && (
                          <div className="flex items-center text-[10px] md:text-xs xl:text-sm rounded-full text-blue-700 bg-blue-200 outline-1 outline-blue-500 ml-1 mt-1 py-1 px-2 leading-none">
                            <p>L</p>
                          </div>
                        )}
                      </>
                    </TableChild>
                  )}
                  <TableChild flexSize="flex-[0.2]">
                    <div
                      className={`ignore-popup-close flex items-center rounded-full hover:bg-red-300 cursor-pointer leading-none p-1 xl:p-1 transition-all duration-200 select-none ${
                        rowPopup?.index === index ? "bg-red-300" : ""
                      }`}
                      onClick={(e) => handleClickMoreRow(e, index, log)}
                    >
                      <EllipsisVertical className="size-5" />
                    </div>
                  </TableChild>
                </div>
              );
            })
          )}
        </div>
      </div>

      {rowPopup && (
        <PopUpMenu
          position={rowPopup.rect}
          open={rowPopupOpen}
          onClose={handleCloseRowPopup}
        >
          <SidebarButton
            name={"Detail"}
            handleClick={() => {
              openModal();
              setSelectedLog(rowPopup.log);
            }}
          />

          {overWrite(rowPopup.log) && (
            <SidebarButton
              name={overWriteLabel(rowPopup.log)}
              handleClick={handleClick}
            />
          )}
        </PopUpMenu>
      )}

      {filterPopup && (
        <FilterPopup
          position={filterPopup.rect}
          open={filterPopupOpen}
          handleClose={handleCloseFilter}
          handleResetFilter={handleResetFilter}
          handleApplyFilter={handleApplyFilter}
          quickFilter={subordinates.length > 1 ? true : false}
          handleClickQuickFilter={handleClickQuickFilter}
          activeQuickFilter={activeQuickFilter}
        >
          <FilterDate
            selectedStartDate={draftFilter.startDate}
            setSelectedStartDate={(v) => setField("startDate", v)}
            displayStartDate={displayStDate}
            setDisplayStartDate={setDisplayStDate}
            selectedEndDate={draftFilter.endDate}
            setSelectedEndDate={(v) => setField("endDate", v)}
            displayEndDate={displayEnDate}
            setDisplayEndDate={setDisplayEnDate}
          />
          {subordinates.length > 1 && (
            <FilterSelect
              label="Employee"
              id="employee"
              options={employeeOptions}
              value={draftFilter.employee}
              handleValueChange={(v) => setField("employee", v)}
            />
          )}
          <FilterSelect
            label="Status"
            id="status"
            options={attendanceLogStatusOptions}
            value={draftFilter.status}
            handleValueChange={(v) => setField("status", v)}
          />
        </FilterPopup>
      )}

      <Modal
        openModal={open}
        onClose={handleCloseModal}
        contentWidth="w-7/8 lg:w-md"
      >
        <ModalPanel
          title={selectedLog?.fullname}
          titlePosition="left"
          handleClose={handleCloseModal}
          badgeColor={
            selectedLog?.final_status === "CONFLICT"
              ? "bg-red-100 outline-red-500 text-red-700"
              : ""
          }
          badgeLabel={
            selectedLog?.final_status === "CONFLICT" ? "CONFLICT" : ""
          }
        >
          <div className="flex flex-1 w-full flex-col">
            <div className="flex flex-1 mb-1 font-medium text-slate-700 ">
              <p>{formatDateIndo(selectedLog?.asattenddate_rev, "long")}</p>
            </div>
            <div className="flex flex-1 justify-evenly rounded-xl">
              {selectedLog?.is_workday === 0 && (
                <>
                  {selectedLog.masuk || selectedLog.pulang ? (
                    <>
                      <div className="flex flex-1 gap-3">
                        <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                          <p className="font-medium text-sm text-left text-slate-600">
                            Clock-in
                          </p>
                          <p
                            className={`font-medium text-lg text-right ${!selectedLog?.masuk || selectedLog?.telat ? "text-red-600" : "text-black"}`}
                          >
                            {isoUTCToTime(selectedLog?.masuk) || "Missing"}
                          </p>
                        </div>
                        <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                          <p className="font-medium text-sm text-left text-slate-600">
                            Clock-out
                          </p>
                          <p
                            className={`font-medium text-lg text-right ${!selectedLog?.pulang || selectedLog?.pulang_cepat ? "text-red-600" : "text-black"}`}
                          >
                            {isoUTCToTime(selectedLog?.pulang) || "Missing"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 justify-center py-4 outline-1 outline-red-400 bg-red-200 rounded-xl">
                      <p className="font-medium text-base">
                        {selectedLog?.calendar_desc}
                      </p>
                    </div>
                  )}
                </>
              )}
              {selectedLog?.is_workday === 1 && (
                <>
                  {selectedLog?.final_status === "CONFLICT" && (
                    <>
                      <div className="flex flex-1 gap-3">
                        <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                          <p className="font-medium text-sm text-left text-slate-600">
                            Clock-in
                          </p>
                          <p
                            className={`font-medium text-lg text-right ${!selectedLog?.masuk || selectedLog?.telat ? "text-red-600" : "text-black"}`}
                          >
                            {isoUTCToTime(selectedLog?.masuk) || "Missing"}
                          </p>
                        </div>
                        <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                          <p className="font-medium text-sm text-left text-slate-600">
                            Clock-out
                          </p>
                          <p
                            className={`font-medium text-lg text-right ${!selectedLog?.pulang || selectedLog?.pulang_cepat ? "text-red-600" : "text-black"}`}
                          >
                            {isoUTCToTime(selectedLog?.pulang) || "Missing"}
                          </p>
                        </div>
                        <div className="flex flex-col flex-1 text-center outline-1 outline-slate-400 bg-slate-200 justify-center rounded-xl">
                          <p className="font-medium text-base">
                            {selectedLog?.leave_name}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedLog?.attendance_status === 0 &&
                    selectedLog?.final_status !== "CONFLICT" && (
                      <div className="flex flex-1 gap-3">
                        <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                          <p className="font-medium text-sm text-left text-slate-600">
                            Clock-in
                          </p>
                          <p
                            className={`font-medium text-lg text-right ${!selectedLog?.masuk || selectedLog?.telat ? "text-red-600" : "text-black"}`}
                          >
                            {isoUTCToTime(selectedLog?.masuk) || "Missing"}
                          </p>
                        </div>
                        <div className="flex flex-col flex-1 outline-1 outline-slate-400 bg-slate-200 p-2 rounded-xl">
                          <p className="font-medium text-sm text-left text-slate-600">
                            Clock-out
                          </p>
                          <p
                            className={`font-medium text-lg text-right ${!selectedLog?.pulang || selectedLog?.pulang_cepat ? "text-red-600" : "text-black"}`}
                          >
                            {isoUTCToTime(selectedLog?.pulang) || "Missing"}
                          </p>
                        </div>
                      </div>
                    )}
                  {selectedLog?.attendance_status === 1 &&
                    selectedLog?.final_status !== "CONFLICT" && (
                      <div className="flex flex-col flex-1 text-center outline-1 outline-slate-400 bg-slate-200 py-3 rounded-xl">
                        <p className="font-medium text-base">
                          {selectedLog?.leave_name}
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>
            <div className="flex flex-1 flex-col p-2 my-1 space-y-1">
              {selectedLog?.is_workday === 1 && (
                <div className="flex flex-1 gap -10 justify-between text-sm ">
                  <p>Desc</p>
                  <p className="text-right">
                    {selectedLog?.attendance_status === 1
                      ? selectedLog?.keterangan
                      : (selectedLog?.keterangan_telat ?? "-")}
                  </p>
                </div>
              )}
              {selectedLog?.telat > 0 && (
                <div className="flex flex-1 justify-between text-sm ">
                  <p>Late</p>
                  <div className="flex gap-1">
                    <p>{selectedLog?.lateFormatted}</p>
                    <p>{selectedLog?.late_excused === 1 ? "(Izin)" : ""}</p>
                  </div>
                </div>
              )}
              {selectedLog?.pulang_cepat > 0 && (
                <div className="flex flex-1 justify-between text-sm ">
                  <p>Early Leave</p>
                  <div className="flex gap-1">
                    <p>{selectedLog?.earlyLeaveFormatted}</p>
                    <p>
                      {selectedLog?.early_leave_excused === 1 ? "(Izin)" : ""}
                    </p>
                  </div>
                </div>
              )}
              {selectedLog?.durasi_lembur > 0 && (
                <div className="flex flex-1 justify-between text-sm ">
                  <p>Overtime</p>
                  <p>{selectedLog?.durasi_lembur}h</p>
                </div>
              )}
            </div>
            {selectedLog?.status !== null && (
              <div className="flex flex-1 flex-col p-3 space-y-1 justify-between rounded-xl outline-1 outline-slate-400">
                <div className="flex flex-1 justify-between text-sm ">
                  <p>Request</p>
                  <div
                    className={`flex w-fit px-2 py-0.5 rounded-full outline-1 text-center text-xs xl:text-sm h-fit ${
                      approvalStatusConfig[selectedLog?.status]?.badgeClass ??
                      "outline-none"
                    }`}
                  >
                    {approvalStatusConfig[selectedLog?.status]?.label ?? ""}
                  </div>
                </div>
                <div className="flex flex-1 justify-between text-sm ">
                  <p>Type</p>
                  <p className="text-right">
                    {selectedLog?.req_leave_name ?? selectedLog?.thumbnail.name}
                  </p>
                </div>
                <div className="flex flex-1 justify-between text-sm ">
                  <p>Request date</p>
                  <p>
                    {formatDateIndo(selectedLog?.req_date_koreksi) ??
                      formatDateIndo(selectedLog?.req_date_leave)}
                  </p>
                </div>
                <div className="flex flex-1 justify-between text-sm ">
                  <p>Decision date</p>
                  <p>
                    {formatDateIndo(selectedLog?.approve_koreksi_date) ??
                      formatDateIndo(selectedLog?.approve_leave_date)}
                  </p>
                </div>
                <div className="flex flex-1 justify-between text-sm ">
                  <p>Decision by</p>
                  <p>{selectedLog?.approver ?? ""}</p>
                </div>
                {selectedLog?.status === 2 && (
                  <div className="flex flex-1 gap-10 justify-between text-sm ">
                    <p>Notes</p>
                    <p className="text-right">
                      {selectedLog?.rejection_notes ?? ""}
                    </p>
                  </div>
                )}
              </div>
            )}
            {overWrite(selectedLog) && (
              <div className="flex justify-center mt-5 mb-2">
                <Button
                  btnLabel={overWriteLabel(selectedLog)}
                  btnColor="bg-slate-200 hover:bg-slate-400 outline-1 outline-slate-300 active:text-white/50"
                  btnWidth=""
                  textSize="text-base shadow-sm!"
                  handleClick={handleClick}
                />
              </div>
            )}
          </div>
        </ModalPanel>
      </Modal>
    </div>
  );
}
