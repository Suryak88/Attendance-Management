import { useContext, useEffect, useMemo, useRef, useState } from "react";
import TableChild from "../../components/atoms/TableChild";
import { reportColumns } from "../../data/attendanceTableHead";
import { AuthContext } from "../../context/AuthContext";
import { useFilter } from "../../hooks/useFilter";
import api from "../../utils/axiosInstance";
import {
  formatDateIndo,
  formatLocalDate,
  formatMySQLTime,
  minuteConvert,
} from "../../utils/Date";
import FilterPopup from "../../components/organisms/FilterPopUp";
import FilterSelect from "../../components/organisms/FilterPopUp/contents/FIlterSelect";
import FilterMonth from "../../components/organisms/FilterPopUp/contents/FilterMonth";
import HeadPage from "../../components/organisms/HeadPage";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import ReportWidget from "../../components/organisms/ReportWidget";
import Button from "../../components/atoms/Button";
import { toast } from "sonner";
import { useModal } from "../../hooks/useModal";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FormSuccess from "../../components/organisms/Modal/contents/FormSuccess";
import { quickGenerateReport } from "../../data/quickGenerateReport";
import FloatingMonth from "../../components/atoms/FloatingMonth";
import { truncateText } from "../../utils/truncateText";
import { approvalStatusConfig } from "../../utils/statusColor";
import PopUpMenu from "../../components/organisms/PopUpMenu";
import { filterCloseStatus } from "../../data/filterCloseStatus";
import BtnLoading from "../../components/atoms/BtnLoading";
import { extractErrorMessage } from "../../utils/extractErrorBlob";
import {
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  Clock5,
  ClockAlert,
  ClockPlus,
  NotepadText,
  TriangleAlert,
  UserRound,
} from "lucide-react";

export default function AttendanceReport() {
  const { user, subordinates } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [warning, setWarning] = useState([]);
  const [isClosed, setIsClosed] = useState(false);
  const [warningIndex, setWarningIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const warningList = getWarnings(warning || {});
  const [reportData, setReportData] = useState([]);
  const [closeStatusData, setCloseStatusData] = useState([]);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [activeQuickSelectEmployee, setActiveQuickSelectEmployee] =
    useState("");
  const [activeFilterCloseStatus, setActiveFilterCloseStatus] = useState(1);
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const [reportMonth, setReportMonth] = useState(prevMonth);
  const [closeStatusMonth, setCloseStatusMonth] = useState(prevMonth);
  const [selectedEmployee, setSelectedEmployee] = useState(new Set());
  // const [selectedCloseStatus, setSelectedCloseStatus] = useState("all");
  const [filterPopup, setFilterPopup] = useState(null);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const subordinate = useMemo(() => {
    return subordinates.map((s) => ({
      label: s.namalengkap.trim(),
      value: s.regnum,
    }));
  }, [subordinates]);
  const STORAGE_KEY = "attendance-report-filter";
  const savedFilter = sessionStorage.getItem(STORAGE_KEY);
  const defaultFilter = {
    month: prevMonth,
    employee: user?.regnum,
    status: "0",
  };
  const initialFilter = savedFilter
    ? {
        ...JSON.parse(savedFilter),
        month: new Date(JSON.parse(savedFilter).month),
      }
    : defaultFilter;

  const {
    openWithMode,
    open,
    close,
    openModal,
    editModal,
    deleteModal,
    showSuccess,
    mode,
  } = useModal(resetForm);
  const {
    draftFilter,
    activeFilter,
    setField,
    applyFilter,
    resetFilter,
    syncDraftWithActive,
    setDraftFilter,
  } = useFilter(initialFilter);
  const activeEmployee = subordinate.find(
    (s) => s.value === activeFilter.employee,
  );
  const tableLoader = useDelayedLoading();
  const reportDataLoader = useDelayedLoading();
  const pdfLoader = useDelayedLoading();
  const closeStatusLoader = useDelayedLoading();
  const submitSolveLoader = useDelayedLoading();
  const submitCloseLoader = useDelayedLoading();
  const skeletonRows = Array.from({ length: 5 });
  const skeletonModal = Array.from({ length: 3 });
  const requestIdRef = useRef(0);
  const requestIdReportRef = useRef(0);
  const requestCloseStatusRef = useRef(0);
  const extendedWarnings =
    warningList.length > 0 ? [...warningList, warningList[0]] : [];
  const radius = 8;
  const stroke = 3;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const dash = circumference * 0.75;
  const [cutiDetail, setCutiDetail] = useState([]);
  const [leaveQuota, setLeaveQuota] = useState(0);
  const [popup, setPopup] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const filteredCloseStatusData = useMemo(() => {
    const filterAktif = filterCloseStatus.find(
      (f) => f.id === activeFilterCloseStatus,
    );

    if (!filterAktif) return closeStatusData;

    return closeStatusData.filter(filterAktif.filter);
  }, [closeStatusData, activeFilterCloseStatus]);

  useEffect(() => {
    if (!user || !activeFilter.month) return;
    fetchReport();
    fetchLeaveQuota();
  }, [user, activeFilter]);

  async function fetchReport() {
    const requestId = ++requestIdRef.current;
    tableLoader.startLoading();

    const params = new URLSearchParams({
      startDate: formatLocalDate(
        new Date(
          activeFilter.month.getFullYear(),
          activeFilter.month.getMonth(),
          1,
        ),
      ),
      endDate: formatLocalDate(
        new Date(
          activeFilter.month.getFullYear(),
          activeFilter.month.getMonth() + 1,
          0,
        ),
      ),
      status: "0",
      targetRegnum: activeFilter.employee,
    });

    api
      .get(`/attendanceReport/?${params.toString()}`)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;

        const formatted = formatting(res.data.logs);
        setLogs(formatted);
        setSummary(res.data.summary);
        setWarning(res.data.flags);
        setIsClosed(res.data.isClosed);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (requestId === requestIdRef.current) tableLoader.stopLoading();
      });
  }

  function formatting(logs) {
    return logs.map((l) => {
      const logDate = new Date(l?.asattenddate_rev);
      const isSunday = logDate.getDay() === 0;
      const lateFormatted = minuteConvert(l?.telat);
      const earlyLeaveFormatted = minuteConvert(l?.pulang_cepat);
      const status = l?.status_koreksi ?? l?.status_leave;
      const config = DAILY_STATUS_CONFIG[l?.final_status] || {};

      return {
        ...l,
        isSunday,
        lateFormatted,
        earlyLeaveFormatted,
        status, // status approval
        statusLabel: config.label || "",
        statusColor: config.color || "bg-slate-200",
      };
    });
  }

  const DAILY_STATUS_CONFIG = {
    ABSENT: {
      label: "Absen",
      color: "bg-orange-200",
    },
    MISSING: {
      label: "Missing",
      color: "bg-red-200",
    },
    CONFLICT: {
      label: "Conflict",
      color: "bg-red-200",
    },
  };

  function getWarnings(flags) {
    const list = [];

    if (flags.has_conflict)
      list.push("Terdapat konflik data yang perlu diselesaikan");

    if (flags.has_missing) list.push("Terdapat data yang belum lengkap");

    if (flags.has_absent) list.push("Terdapat absen/alpha");

    return list;
  }

  useEffect(() => {
    if (warningList.length <= 1) return;

    const interval = setInterval(() => {
      setWarningIndex((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [warningList.length]);

  useEffect(() => {
    if (warningIndex === warningList.length) {
      // sudah sampai clone terakhir
      setTimeout(() => {
        setIsTransitioning(false); // matikan animasi
        setWarningIndex(0); // reset ke asli

        // hidupkan lagi animasi setelah repaint
        setTimeout(() => {
          setIsTransitioning(true);
        }, 10);
      }, 500); // sesuai duration animasi
    }
  }, [warningIndex, warningList.length]);

  function handleTransitionEnd() {
    if (warningIndex === warningList.length) {
      setIsTransitioning(false);
      setWarningIndex(0);
    }
  }

  useEffect(() => {
    if (!isTransitioning) {
      requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
    }
  }, [isTransitioning]);

  useEffect(() => {
    handleOpenReport();
  }, [reportMonth]);

  useEffect(() => {
    fetchClosedStatus();
  }, [closeStatusMonth]);

  function handleClickFilter(e) {
    e.stopPropagation();

    if (filterPopupOpen) {
      handleCloseFilter();
      return;
    }

    syncDraftWithActive();
    const rect = e.currentTarget.getBoundingClientRect();

    setFilterPopup({
      rect,
    });
    setFilterPopupOpen(false);

    requestAnimationFrame(() => {
      setFilterPopupOpen(true);
    });
  }

  function handleApplyFilter() {
    applyFilter();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draftFilter));
  }

  function handleCloseFilter() {
    setFilterPopupOpen(false);
    setTimeout(() => {
      setFilterPopup(null);
    }, 200);
  }

  function resetForm() {
    setActiveQuickSelectEmployee("");
    setSelectedResolution(null);
    toast.dismiss();
    submitSolveLoader.stopLoading();
    setSelectedConflict(null);
  }

  async function submitCloseAttendance() {
    if (warning.has_conflict || warning.has_missing) {
      return toast.error("Terdapat data konflik / data belum lengkap");
    }

    try {
      submitCloseLoader.startLoading();
      await api.post("/attendanceReport/", {
        targetRegnum: activeFilter.employee,
        period: activeFilter.month,
      });
      await fetchReport();
      showSuccess();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to Close Attendance!",
      );
    } finally {
      submitCloseLoader.stopLoading();
    }
  }

  async function handleOpenReport() {
    const requestIdReport = ++requestIdReportRef.current;
    reportDataLoader.startLoading();

    await api
      .post("/attendanceReport/printAll", {
        mode: "all",
        period: reportMonth,
      })
      .then((res) => {
        if (requestIdReport !== requestIdReportRef.current) return;
        setReportData(res.data.reports);
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Failed to Fetch Attendance Data!",
        );
      })
      .finally(() => {
        if (requestIdReport === requestIdReportRef.current)
          reportDataLoader.stopLoading();
      });
  }

  function toggleEmployee(regnum) {
    setActiveQuickSelectEmployee("");

    setSelectedEmployee((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(regnum)) {
        newSet.delete(regnum);
      } else {
        newSet.add(regnum);
      }

      return newSet;
    });
  }

  function handleClickQuickFilter(data) {
    if (activeQuickSelectEmployee === data.id) {
      setActiveQuickSelectEmployee(null);
      setSelectedEmployee(new Set());
      return;
    }
    const selectedIds = data.getFilter(reportData);

    setActiveQuickSelectEmployee(data.id);
    setSelectedEmployee(new Set(selectedIds));
  }

  function handleResetSelectedEmployee() {
    setSelectedEmployee(new Set());
    setActiveQuickSelectEmployee("");
  }

  async function handleGeneratePDF() {
    if ([...selectedEmployee].length === 0) {
      toast.error("Silahkan pilih karyawan terlebih dahulu");
      return;
    }
    const fileName = `Attendance-${reportMonth.toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    })}.pdf`;
    try {
      pdfLoader.startLoading();

      const res = await api.post(
        "/attendanceReport/generate-pdf",
        {
          employees: Array.from(selectedEmployee),
          period: reportMonth,
        },
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName}`);

      document.body.appendChild(link);
      link.click();
    } catch (error) {
      // toast.error(error?.response?.data?.message || "Failed to Generate PDF");
      const msg = await extractErrorMessage(error);
      toast.error(msg);
    } finally {
      pdfLoader.stopLoading();
    }
  }

  function modalConflictCommand() {
    if (selectedResolution === "leave")
      return "Data cuti dipilih (absensi akan diabaikan)";
    if (selectedResolution === "attendance")
      return "Data absensi dipilih (cuti akan dibatalkan)";
    if (!selectedResolution) return "Pilih data yang ingin digunakan!";
  }

  async function handleSolveConflict() {
    if (!selectedResolution) {
      toast.error("Silahkan pilih data yang ingin digunakan");
      return;
    }

    submitSolveLoader.startLoading();
    try {
      await api.post("/attendanceReport/solveConflict", {
        targetRegnum: selectedConflict.regnum,
        date: selectedConflict.asattenddate_rev,
        solution: selectedResolution,
      });
      await fetchReport();
      showSuccess();
      submitSolveLoader.stopLoading();
    } catch (error) {
      if (error?.response?.data?.code === "PENDING_LEAVE_EXISTS") {
        const toastId = toast.warning("Ada revisi cuti pending", {
          description: "Melanjutkan proses akan membatalkan pengajuan revisi.",
          duration: Infinity,
          onDismiss: () => submitSolveLoader.stopLoading(),
          action: {
            label: "Lanjutkan",
            onClick: async () => {
              try {
                await api.post("/attendanceReport/solveConflict", {
                  targetRegnum: selectedConflict.regnum,
                  date: selectedConflict.asattenddate_rev,
                  solution: selectedResolution,
                  force: true,
                });

                await fetchReport();
                showSuccess();
              } catch (error) {
                toast.error(
                  error?.response?.data?.message || "Gagal memproses",
                );
              } finally {
                submitSolveLoader.stopLoading();
              }
            },
          },
          cancel: {
            label: "Batal",
            onClick: () => submitSolveLoader.stopLoading(),
          },
        });
      } else {
        toast.error(error?.response?.data?.message || "Failed to submit");
        submitSolveLoader.stopLoading();
      }
    }
  }

  async function fetchLeaveQuota() {
    await api
      .get(`leaveRequest/quota/`, {
        params: {
          targetRegnum: activeFilter.employee,
          date: activeFilter.month,
        },
      })
      .then((res) => {
        const totalQuota = res.data.reduce(
          (acc, item) => acc + Number(item.quota || 0),
          0,
        );
        setCutiDetail(res.data);
        setLeaveQuota(totalQuota);
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Failed to fetch leave quota",
        );
      });
  }

  function handleInfoCuti(e, index, item) {
    e.stopPropagation();

    if (popup && popup.index === index) {
      handleClosePopup();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();

    setPopup({
      index,
      item,
      rect,
    });
    setPopupOpen(false);

    requestAnimationFrame(() => {
      setPopupOpen(true);
    });
  }

  function handleClosePopup() {
    setPopupOpen(false);
    setTimeout(() => {
      setPopup(null);
    }, 200);
  }

  useEffect(() => {
    if (!popup) return;

    const handleScroll = () => handleClosePopup();

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [popup]);

  // useEffect(() => {
  //   if (!filterPopup) return;

  //   const handleScroll = () => handleCloseFilter();

  //   window.addEventListener("scroll", handleScroll, true);
  //   return () => window.removeEventListener("scroll", handleScroll, true);
  // }, [filterPopup]);

  async function fetchClosedStatus() {
    const requestCloseStatus = ++requestCloseStatusRef.current;
    closeStatusLoader.startLoading();

    await api
      .post("/attendanceReport/closeStatus/", {
        period: closeStatusMonth,
      })
      .then((res) => {
        if (requestCloseStatus !== requestCloseStatusRef.current) return;
        setCloseStatusData(res.data);
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message ||
            "Failed to Fetch Close Attendance Status",
        );
      })
      .finally(() => {
        if (requestCloseStatus === requestCloseStatusRef.current)
          closeStatusLoader.stopLoading();
      });
  }

  function handleClickFilterStatus(data) {
    if (activeFilterCloseStatus === data.id) {
      setActiveFilterCloseStatus(null);
      return;
    }

    setActiveFilterCloseStatus(data.id);
  }

  return (
    <div className="bg-slate-100 flex flex-col flex-1 p-0.5 min-h-0 overflow-y-auto">
      <HeadPage
        label={"Attendance Report"}
        employeeName={activeEmployee?.label}
        handleClick={handleClickFilter}
      />
      {warningList.length > 0 && (
        <div className="flex bg-orange-100 gap-1 p-2 mx-2 rounded-xl outline-1 outline-orange-500 items-center">
          <span
            className={`p-0.5 text-orange-500 leading-none align-middle select-none`}
          >
            <TriangleAlert />
          </span>
          <div className="relative overflow-hidden w-full">
            <div
              onTransitionEnd={handleTransitionEnd}
              className={`flex ${
                isTransitioning
                  ? "transition-transform duration-500 ease-in-out"
                  : ""
              }`}
              style={{
                transform: `translateX(-${warningIndex * 100}%)`,
              }}
            >
              {extendedWarnings.map((w, i) => (
                <div
                  key={i}
                  className="min-w-full text-sm xl:text-base font-medium"
                >
                  {w}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {warningList.length > 1 && (
        <div className="flex justify-center gap-1 mt-1">
          {warningList.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === warningIndex ? "bg-orange-400" : "bg-orange-200"
              }`}
            />
          ))}
        </div>
      )}
      <div
        className={`flex m-1 p-2 gap-3 xl:gap-4 overflow-x-auto scrollbar-hidden `}
      >
        <ReportWidget
          title={"Kehadiran"}
          // iconName={"event_available"}
          Icon={CalendarCheck}
          dataHead={summary?.present_days}
          dataAll={summary?.total_workdays}
          unit={"hari"}
          color={"blue"}
          loading={tableLoader.loading}
        />
        <ReportWidget
          title={"Durasi Kerja"}
          // iconName={"event_note"}
          Icon={Clock5}
          dataHead={minuteConvert(summary?.total_actual_work_minutes)}
          dataAll={minuteConvert(summary?.total_target_work_minutes)}
          // unit={"menit"}
          color={"blue"}
          loading={tableLoader.loading}
        />
        <ReportWidget
          title={"Terlambat"}
          // iconName={"schedule"}
          Icon={ClockAlert}
          dataHead={summary?.total_late_minutes_unexcused}
          unit={"menit"}
          color={"red"}
          loading={tableLoader.loading}
        />
        <ReportWidget
          title={"Lembur"}
          // iconName={"more_time"}
          Icon={ClockPlus}
          dataHead={summary?.total_overtime_hours}
          unit={"jam"}
          color={"blue"}
          loading={tableLoader.loading}
        />
        <ReportWidget
          title={"Sisa Cuti"}
          // iconName={"emoji_people"}
          Icon={CalendarOff}
          dataHead={leaveQuota}
          info={handleInfoCuti}
          unit={"hari"}
          color={"green"}
          loading={tableLoader.loading}
          popupInfo={popupOpen}
        />
      </div>
      <div className="flex flex-1 flex-col m-1 space-y-2 min-h-0 text-xs">
        <div className="flex">
          {subordinates.length > 1 && (
            <button
              className="mx-2 px-2 py-1 bg-slate-100 rounded-full shadow-sm font-medium text-xs lg:text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md disabled:bg-gray-200 disabled:text-slate-500 disabled:hover:text-slate-500 disabled:hover:outline-slate-400 disabled:hover:shadow-sm disabled:hover:cursor-not-allowed"
              onClick={deleteModal}
              disabled={warning.has_conflict || warning.has_missing || isClosed}
              title={`${isClosed ? "Periode Closed" : ""}`}
            >
              Close Attendance
            </button>
          )}
          <button
            className="mx-2 px-2 py-1 bg-slate-100 rounded-full shadow-sm font-medium text-xs lg:text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md "
            onClick={() => {
              fetchClosedStatus();
              openWithMode("closeStatus");
            }}
          >
            View Close Status
          </button>
          <button
            className="mx-2 px-2 py-1 bg-slate-100 rounded-full shadow-sm font-medium text-xs lg:text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md "
            onClick={() => {
              handleOpenReport();
              openModal();
            }}
          >
            Generate Report
          </button>
        </div>
        <div className="flex bg-slate-300 text-slate-600 p-2 mx-1 rounded-2xl font-bold">
          {reportColumns.map((col) => (
            <div
              key={col.key}
              className="flex flex-1 items-center text-center text-xs md:text-sm xl:text-base justify-evenly"
            >
              {col.label}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 space-y-2 pb-4 focus:outline-none ">
          {logs.length === 0 && !tableLoader.loading && (
            <div className="font-semibold my-3">
              <TableChild>No Data</TableChild>
            </div>
          )}
          {tableLoader.loading ? (
            <>
              {skeletonRows.map((m, index) => (
                <div
                  key={index}
                  className="skeleton flex bg-slate-200 px-1 py-2 md:p-2 mx-2 rounded-2xl items-center min-h-0 animate-pulse select-none"
                >
                  <div className="flex flex-1 animate-pulse rounded-2xl text-transparent select-none">
                    loading
                  </div>
                </div>
              ))}
            </>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`flex px-1 py-2 md:p-2 mx-1 rounded-2xl items-center min-h-0 text-xs ${log?.statusColor}`}
              >
                <TableChild textSize="text-xs" red={log?.is_workday === 0}>
                  {formatDateIndo(log.asattenddate_rev)}
                </TableChild>
                {!log?.calendar_type && (
                  <TableChild flexSize="flex-6">
                    {"No Calendar Data"}
                  </TableChild>
                )}
                {log?.is_workday === 0 && (
                  <>
                    {log?.masuk || log?.pulang ? (
                      <>
                        <TableChild red={log?.telat} textSize="text-xs">
                          {log?.masuk ? (
                            formatMySQLTime(log?.masuk)
                          ) : (
                            <span className="text-xs lg:text-sm font-semibold text-red-600">
                              {"Missing"}
                            </span>
                          )}
                        </TableChild>
                        <TableChild red={log?.pulang_cepat} textSize="text-xs">
                          {log?.pulang ? (
                            formatMySQLTime(log?.pulang)
                          ) : (
                            <span className="text-xs lg:text-sm font-semibold text-red-600">
                              {"Missing"}
                            </span>
                          )}
                        </TableChild>
                        <TableChild textSize="text-xs">
                          {minuteConvert(log?.work_time)}
                        </TableChild>
                        <TableChild>
                          {log.telat > 0 ? log?.lateFormatted : ""}
                          {log.late_excused ? " (Izin)" : ""}
                        </TableChild>
                        <TableChild>
                          {log?.pulang_cepat > 0
                            ? log?.earlyLeaveFormatted
                            : ""}
                        </TableChild>
                        <TableChild>
                          {log?.durasi_lembur > 0
                            ? `${Number(log?.durasi_lembur)}h`
                            : ""}
                        </TableChild>
                        <TableChild>
                          <div className="flex items-center">
                            {log?.statusLabel && (
                              <>
                                <span
                                  className={`p-0.5 text-orange-500 leading-none align-middle select-none text-base!`}
                                >
                                  <TriangleAlert className="size-4" />
                                </span>
                                {log?.statusLabel}
                              </>
                            )}
                          </div>
                        </TableChild>
                      </>
                    ) : (
                      <>
                        <TableChild
                          textSize="text-xs"
                          flexSize="flex-6"
                          red={true}
                        >
                          {log?.calendar_desc || "Hari Libur"}
                        </TableChild>
                        <TableChild />
                      </>
                    )}
                  </>
                )}
                {log?.is_workday === 1 && (
                  <>
                    {log?.final_status === "CONFLICT" && (
                      <>
                        <TableChild red={log?.telat} textSize="text-xs">
                          {log?.masuk ? (
                            formatMySQLTime(log?.masuk)
                          ) : (
                            <span className="text-xs lg:text-sm font-semibold text-red-600">
                              {"Missing"}
                            </span>
                          )}
                        </TableChild>
                        <TableChild red={log?.pulang_cepat} textSize="text-xs">
                          {log?.pulang ? (
                            formatMySQLTime(log?.pulang)
                          ) : (
                            <span className="text-xs lg:text-sm font-semibold text-red-600">
                              {"Missing"}
                            </span>
                          )}
                        </TableChild>
                        <TableChild textSize="text-xs" flexSize="flex-4">
                          {log?.leave_name}
                        </TableChild>
                        <TableChild>
                          <div className="flex flex-col lg:flex-row gap-0.5 lg:gap-2 items-center">
                            {log?.statusLabel && (
                              <>
                                <div className="flex items-center">
                                  <span
                                    className={`p-0.5 text-orange-500 leading-none align-middle select-none text-base!`}
                                  >
                                    <TriangleAlert className="size-4" />
                                  </span>
                                  {log?.statusLabel}
                                </div>
                                {subordinates.length > 1 && (
                                  <Button
                                    btnLabel={"Solve"}
                                    btnColor="outline-1 bg-blue-200 outline-blue-500 hover:bg-blue-300 "
                                    btnWidth="mt-0.5 py-0! px-1.5!"
                                    textSize="text-sm shadow-none! font-normal!"
                                    handleClick={() => {
                                      editModal();
                                      setSelectedConflict(log);
                                    }}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </TableChild>
                      </>
                    )}

                    {log?.attendance_status === 0 &&
                      log?.final_status !== "CONFLICT" && (
                        <>
                          <TableChild red={log?.telat} textSize="text-xs">
                            {log?.masuk ? (
                              formatMySQLTime(log?.masuk)
                            ) : (
                              <span className="text-xs lg:text-sm font-semibold text-red-600">
                                {"Missing"}
                              </span>
                            )}
                          </TableChild>
                          <TableChild
                            red={log?.pulang_cepat}
                            textSize="text-xs"
                          >
                            {log?.pulang ? (
                              formatMySQLTime(log?.pulang)
                            ) : (
                              <span className="text-xs lg:text-sm font-semibold text-red-600">
                                {"Missing"}
                              </span>
                            )}
                          </TableChild>
                          <TableChild textSize="text-xs">
                            {minuteConvert(log?.work_time)}
                          </TableChild>
                          <TableChild>
                            {log.telat > 0 ? log?.lateFormatted : ""}
                            {log.late_excused ? " (Izin)" : ""}
                          </TableChild>
                          <TableChild>
                            {log?.pulang_cepat > 0
                              ? log?.earlyLeaveFormatted
                              : ""}
                            {log.early_leave_excused ? " (Izin)" : ""}
                          </TableChild>
                          <TableChild>
                            {log?.durasi_lembur > 0
                              ? `${Number(log?.durasi_lembur)}h`
                              : ""}
                          </TableChild>
                          <TableChild>
                            <div className="flex items-center">
                              {log?.statusLabel && (
                                <>
                                  <span
                                    className={`p-0.5 text-orange-500 leading-none align-middle select-none text-base!`}
                                  >
                                    <TriangleAlert className="size-4" />
                                  </span>
                                  {log?.statusLabel}
                                </>
                              )}
                            </div>
                          </TableChild>
                        </>
                      )}

                    {log?.attendance_status === 1 &&
                      log?.final_status !== "CONFLICT" && (
                        <>
                          <TableChild textSize="text-xs" flexSize="flex-6">
                            {log?.leave_name}
                          </TableChild>
                          <TableChild>
                            <div className="flex items-center">
                              {log?.statusLabel && (
                                <>
                                  <span
                                    className={`p-0.5 text-orange-500 leading-none align-middle select-none text-base!`}
                                  >
                                    <TriangleAlert className="size-4" />
                                  </span>
                                  {log?.statusLabel}
                                </>
                              )}
                            </div>
                          </TableChild>
                        </>
                      )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {filterPopup && (
        <FilterPopup
          position={filterPopup.rect}
          open={filterPopupOpen}
          handleClose={handleCloseFilter}
          handleResetFilter={() => setDraftFilter(defaultFilter)}
          handleApplyFilter={handleApplyFilter}
        >
          <FilterMonth
            selectedMonth={draftFilter.month}
            setSelectedMonth={(v) => setField("month", v)}
            displayMonth={draftFilter.month.toLocaleString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          />

          {subordinates.length > 1 && (
            <FilterSelect
              label="Employee"
              id="employee"
              options={subordinate}
              value={draftFilter.employee}
              handleValueChange={(v) => setField("employee", v)}
            />
          )}
        </FilterPopup>
      )}

      <Modal
        openModal={open}
        onClose={close}
        contentWidth={
          mode === "form" || mode === "closeStatus"
            ? reportData.length > 1
              ? "w-7/8 lg:w-2xl"
              : "w-7/8 lg:w-md"
            : "w-3/4 lg:w-fit"
        }
      >
        {mode === "confirm" && (
          <ModalPanel title={"Close Attendance?"} handleClose={close}>
            {warning.has_absent && (
              <>
                <div className="flex bg-orange-100 gap-1 p-2 mb-5 rounded-xl outline-1 outline-orange-500 items-center w-full">
                  <span
                    className={`p-0.5 text-orange-500 leading-none align-middle select-none`}
                  >
                    <TriangleAlert />
                  </span>
                  <div className="flex flex-col">
                    <p className="text-sm xl:text-base font-medium">
                      {warningList}
                    </p>
                    <p className="text-xs font-normal">
                      Absen/alpha akan ikut tercatat dalam laporan
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="flex flex-1 w-full justify-evenly p-2 gap-3 text-center rounded-xl outline-1 outline-slate-400">
              <div className="flex flex-col items-center">
                <span className={`rounded-full p-0.5 select-none`}>
                  <UserRound className="size-5" />
                </span>
                <p>{activeEmployee?.label}</p>
              </div>
              <div className="flex flex-col items-center">
                <span className={`rounded-full p-0.5 select-none`}>
                  <CalendarDays className="size-5" />
                </span>
                <p>
                  {activeFilter.month.toLocaleString("id-ID", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex w-full text-xs lg:text-sm mt-3">
              <p>*Data absensi tidak dapat diubah setelah close attendance.</p>
            </div>
            <div className="flex flex-1 w-full justify-evenly mt-5 p-2 transition-all duration-300">
              <button
                className="px-6 py-2 rounded-xl bg-slate-200 outline outline-slate-300 cursor-pointer hover:outline-slate-500 hover:text-black/60 transition"
                onClick={close}
              >
                No
              </button>
              <button
                className={`px-6 py-2 rounded-xl bg-blue-200 outline outline-blue-300 cursor-pointer hover:outline-blue-500 hover:bg-blue-300 hover:text-black/60 transition-all  ease-in-out ${submitCloseLoader.loading ? "w-36" : "w-18"}`}
                onClick={submitCloseAttendance}
              >
                <div className="flex text-center w-full justify-center ">
                  <div
                    className={`w-full justify-around ${submitCloseLoader.loading ? "flex" : "hidden"}`}
                  >
                    <BtnLoading label={"Processing"} />
                  </div>
                  <div
                    className={`w-full text-center ${submitCloseLoader.loading ? "hidden" : "flex"}`}
                  >
                    Yes
                  </div>
                </div>
              </button>
            </div>
          </ModalPanel>
        )}

        {mode === "success" && (
          <div
            className={`w-full transition-all duration-300 ${
              mode === "success"
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ModalPanel
              title={
                selectedConflict ? "Conflict Solved" : "Attendance Closed!"
              }
              handleClose={close}
            >
              <FormSuccess />
              <Button handleClick={close} btnLabel={"OK"} btnWidth="" />
            </ModalPanel>
          </div>
        )}

        {mode === "form" && (
          <ModalPanel title={"Generate Report"} handleClose={close}>
            <div className="flex flex-1 flex-col w-full overflow-y-auto max-h-150 lg:max-h-175">
              <div className="flex-col lg:flex-row flex gap-3 lg:gap-5 items-center justify-center">
                <div className="flex">
                  <FloatingMonth
                    id={"reportMonth"}
                    selectedMonth={reportMonth}
                    setSelectedMonth={setReportMonth}
                    displayMonth={reportMonth.toLocaleString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                    fontThickness="font-normal"
                    border="border"
                    inputFontSize="text-sm"
                  />
                </div>
              </div>
              <hr className="text-slate-400 shadow-sm my-2" />
              <div className="flex flex-col">
                <div className="flex flex-col lg:flex-row lg:justify-between">
                  <div className="flex">
                    <h3 className="font-medium text-center">Employee</h3>
                  </div>
                  <div className="flex gap-3 my-2 mx-1">
                    {quickGenerateReport.map((t, index) => (
                      <div
                        key={index}
                        className={`flex flex-wrap rounded-xl px-2 py-1 text-xs lg:text-sm w-fit cursor-pointer outline-1 outline-slate-300 shadow-sm hover:bg-slate-300 bg-slate-200 ${activeQuickSelectEmployee === t.id ? "bg-slate-300 outline-slate-500" : "bg-slate-200"}`}
                        onClick={() => {
                          handleClickQuickFilter(t);
                        }}
                      >
                        {t.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={`grid grid-cols-1 gap-2 mt-2 lg:mt-5 ${reportData.length > 1 ? "lg:grid-cols-2 " : "mx-auto items-center w-xs"}`}
                >
                  {reportDataLoader.loading
                    ? skeletonModal.map((m, index) => (
                        <label
                          key={index}
                          className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-100 cursor-pointer gap-2 text-transparent"
                        >
                          <div className="flex items-center w-full rounded-xl gap-2">
                            <div className="skeleton bg-slate-200 rounded">
                              00
                            </div>
                            <span className="skeleton w-full rounded-lg bg-slate-200">
                              loading
                            </span>
                          </div>

                          <div className="skeleton flex gap-1 lg:gap-1.5 justify-end flex-wrap bg-slate-200 rounded-lg">
                            loading
                          </div>
                        </label>
                      ))
                    : reportData.map((r) => (
                        <label
                          key={r.employee.regnum}
                          className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-100 cursor-pointer gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedEmployee.has(r.employee.regnum)}
                              onChange={() => toggleEmployee(r.employee.regnum)}
                            />
                            <span>
                              {truncateText(r.employee.namalengkap, 15, false)}
                            </span>
                          </div>

                          <div className="flex gap-1 lg:gap-1.5 justify-end flex-wrap">
                            {r.flags.has_conflict && (
                              <span className="text-red-600 bg-red-100 outline-1 outline-red-500 px-1 py-0.5 rounded-xl text-xs">
                                Conflict
                              </span>
                            )}
                            {r.flags.has_missing && (
                              <span className="text-red-600 bg-red-100 outline-1 outline-red-500 px-1 py-0.5 rounded-xl text-xs">
                                Missing{" "}
                              </span>
                            )}
                            {r.flags.has_absent && (
                              <span className="text-amber-600 bg-amber-100 outline-1 outline-amber-500 px-1 py-0.5 rounded-xl text-xs">
                                Absent
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                </div>
                <div className="flex w-full justify-around mt-10 mb-3">
                  <Button
                    btnLabel={"Clear Check"}
                    btnColor="outline-1 outline-slate-300 hover:outline-slate-500 hover:text-black/60!"
                    btnWidth="w-35 px-1!"
                    textSize="text-sm shadow-none! font-normal!"
                    handleClick={handleResetSelectedEmployee}
                    btnTitle="Uncheck all"
                  />
                  <Button
                    btnLabel={
                      pdfLoader.loading ? (
                        <BtnLoading label={"Downloading PDF"} />
                      ) : (
                        <div className="my-0.5">Download PDF</div>
                      )
                    }
                    btnColor="outline-1 outline-slate-300 hover:outline-slate-500 hover:text-black/60!"
                    btnWidth="w-39 px-1!"
                    textSize="text-sm shadow-sm!"
                    handleClick={handleGeneratePDF}
                    btnTitle="Download as PDF"
                    btndisable={pdfLoader.loading}
                  />
                </div>
              </div>
            </div>
          </ModalPanel>
        )}

        {mode === "edit" && (
          <ModalPanel title={"Solve Conflict"} handleClose={close}>
            <div className="flex w-full">
              <p>
                {formatDateIndo(selectedConflict?.asattenddate_rev, "long")} :
              </p>
            </div>
            <div className="flex flex-col w-full gap-2 py-2">
              <label className="flex w-full p-2 rounded-xl outline-1 lg:w-xs outline-slate-400 cursor-pointer">
                <div className="flex gap-3">
                  <input
                    type="radio"
                    name="solveConflict"
                    value={"leave"}
                    checked={selectedResolution === "leave"}
                    onChange={(e) => setSelectedResolution(e.target.value)}
                    disabled={submitSolveLoader.loading}
                  />
                  <div className="flex flex-col w-full text-sm">
                    <span className="font-medium text-base">
                      {selectedConflict?.leave_name} -{" "}
                      {truncateText(selectedConflict?.keterangan)}
                    </span>
                    <p>
                      Requested on{" "}
                      {formatDateIndo(selectedConflict?.req_date_leave)}
                    </p>
                    <p>
                      {
                        approvalStatusConfig[selectedConflict?.status_leave]
                          .label
                      }{" "}
                      by {selectedConflict?.approver} on{" "}
                      {formatDateIndo(selectedConflict?.approve_leave_date)}
                    </p>
                  </div>
                </div>
              </label>
              <label className="flex w-full p-2 rounded-xl outline-1 outline-slate-400 cursor-pointer">
                <div className="flex gap-3">
                  <input
                    type="radio"
                    name="solveConflict"
                    value={"attendance"}
                    checked={selectedResolution === "attendance"}
                    onChange={(e) => setSelectedResolution(e.target.value)}
                    disabled={submitSolveLoader.loading}
                  />
                  <div className="flex flex-col w-full text-sm">
                    <span className="font-medium text-base">Absensi</span>
                    <p>
                      Clock-in {formatMySQLTime(selectedConflict?.masuk) || "-"}
                    </p>
                    <p>
                      Clock-out{" "}
                      {formatMySQLTime(selectedConflict?.pulang) || "-"}
                    </p>
                  </div>
                </div>
              </label>
            </div>
            <div className="text-sm w-full flex">
              <p>{modalConflictCommand()}</p>
            </div>
            <div className="mb-2 mt-7">
              <Button
                btnLabel={
                  submitSolveLoader.loading ? (
                    <BtnLoading label={"Processing"} />
                  ) : (
                    <div className="my-0.5">Submit</div>
                  )
                }
                btnColor="outline-1 outline-blue-500 bg-blue-200 hover:bg-blue-300"
                btnWidth="w-28 px-1!"
                textSize="text-sm shadow-none!"
                handleClick={handleSolveConflict}
                btndisable={submitSolveLoader.loading}
              />
            </div>
          </ModalPanel>
        )}

        {mode === "closeStatus" && (
          <ModalPanel title={"Close Attendance Status"} handleClose={close}>
            <div className="flex flex-1 flex-col w-full mb-8">
              <div className="flex gap-3 lg:gap-5 items-center justify-center">
                <div className="flex">
                  <FloatingMonth
                    id={"closeStatusMonth"}
                    selectedMonth={closeStatusMonth}
                    setSelectedMonth={setCloseStatusMonth}
                    displayMonth={closeStatusMonth.toLocaleString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                    fontThickness="font-normal"
                    border="border"
                    inputFontSize="text-sm"
                  />
                </div>
              </div>
              <hr className="text-slate-400 shadow-sm my-2" />
              <div className="flex flex-col">
                <div className="flex flex-col lg:flex-row lg:justify-between">
                  <div className="flex">
                    <h3 className="font-medium text-center">Employee</h3>
                  </div>
                  <div className="flex gap-3 my-2">
                    {filterCloseStatus.map((t, index) => (
                      <div
                        key={index}
                        className={`flex flex-wrap rounded-xl px-2 py-1 text-xs lg:text-sm w-fit cursor-pointer outline-1 outline-slate-300 shadow-sm hover:bg-slate-300 bg-slate-200 ${activeFilterCloseStatus === t.id ? "bg-slate-300 outline-slate-500" : "bg-slate-200"}`}
                        onClick={() => {
                          handleClickFilterStatus(t);
                        }}
                      >
                        {t.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={`grid grid-cols-1 gap-2 mt-2 lg:mt-5 ${filteredCloseStatusData.length > 1 ? "lg:grid-cols-2 " : "mx-auto items-center w-xs"}`}
                >
                  {filteredCloseStatusData.length === 0 &&
                    !closeStatusLoader.loading && (
                      <div className="flex w-full justify-center text-center mt-3">
                        No Data
                      </div>
                    )}

                  {closeStatusLoader.loading
                    ? skeletonModal.map((m, index) => (
                        <label
                          key={index}
                          className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-100 cursor-pointer gap-2 text-transparent"
                        >
                          <div className="flex items-center w-full rounded-xl gap-2">
                            <span className="skeleton rounded-lg bg-slate-200">
                              loading123
                            </span>
                          </div>

                          <div className="skeleton flex gap-1 lg:gap-1.5 w-full justify-end flex-wrap bg-slate-200 rounded-lg">
                            loading
                          </div>
                        </label>
                      ))
                    : filteredCloseStatusData.map((r) => (
                        <div
                          key={r.regnum}
                          className="flex items-center justify-between p-1 rounded-xl gap-2 outline-1 outline-slate-300"
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {truncateText(r.namalengkap, 12, false)}
                            </span>
                          </div>

                          <div className="flex gap-1 lg:gap-1.5 justify-end flex-wrap">
                            {r.status === "SUCCESS" && (
                              <span className="text-green-600 bg-green-100 outline-1 outline-green-500 px-2 py-0.5 rounded-xl text-xs">
                                Closed
                              </span>
                            )}
                            {r.status === "FAILED" && (
                              <>
                                {r.absent_count > 0 && (
                                  <span className="text-orange-600 bg-orange-100 outline-1 outline-orange-500 px-1.5 py-0.5 rounded-xl text-xs">
                                    {r.absent_count} Absent
                                  </span>
                                )}
                                {r.missing_count > 0 && (
                                  <span className="text-red-600 bg-red-100 outline-1 outline-red-500 px-1.5 py-0.5 rounded-xl text-xs">
                                    {r.missing_count} Missing
                                  </span>
                                )}
                                {r.conflict_count > 0 && (
                                  <span className="text-red-600 bg-red-100 outline-1 outline-red-500 px-1.5 py-0.5 rounded-xl text-xs">
                                    {r.conflict_count} Conflict
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </ModalPanel>
        )}
      </Modal>

      {popup && (
        <PopUpMenu
          position={popup.rect}
          open={popupOpen}
          onClose={handleClosePopup}
          popupWidth="w-50 lg:w-60"
        >
          <div className="flex flex-1 flex-col gap-2 p-1 m-1 text-xs">
            <div className="flex flex-1 rounded-xl p-1 outline-1 outline-slate-400 shadow-sm">
              <TableChild>Cuti</TableChild>
              <TableChild>Kuota</TableChild>
              <TableChild flexSize="flex-2">Expired</TableChild>
            </div>
            {cutiDetail.length === 0 && (
              <div className="flex flex-1 justify-center">
                <p>No Data</p>
              </div>
            )}
            {cutiDetail.map((cuti) => (
              <div className="flex flex-1 gap-1 p-1 rounded-xl" key={cuti.id}>
                <TableChild>{cuti.year}</TableChild>
                <TableChild>{cuti.quota}</TableChild>
                <TableChild flexSize="flex-2">
                  {formatDateIndo(cuti.expired_at)}
                </TableChild>
              </div>
            ))}
          </div>
        </PopUpMenu>
      )}
    </div>
  );
}
