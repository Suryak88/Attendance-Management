import { useState } from "react";
import Card from "../../components/organisms/Card";
import HeadPage from "../../components/organisms/HeadPage";
import api from "../../utils/axiosInstance";
import { useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useFilter } from "../../hooks/useFilter";
import { useMemo } from "react";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import {
  formatDateFromPicker,
  formatDateIndo,
  formatLocalDate,
} from "../../utils/Date";
import { toast } from "sonner";
import FilterPopup from "../../components/organisms/FilterPopUp";
import FilterDate from "../../components/organisms/FilterPopUp/contents/FilterDate";
import FilterSelect from "../../components/organisms/FilterPopUp/contents/FIlterSelect";
import { useLeaveTypeStore } from "../../store/useLeaveTypeStore";
import { useRef } from "react";
import { CalendarFold } from "lucide-react";

export default function LeaveUsage() {
  const { user, subordinates } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterPopup, setFilterPopup] = useState(null);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [displayStDate, setDisplayStDate] = useState("");
  const [displayEnDate, setDisplayEnDate] = useState("");
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1);
  const STORAGE_KEY = "leave-usage-filter";
  const savedFilter = sessionStorage.getItem(STORAGE_KEY);
  const defaultFilter = {
    startDate: firstDay,
    endDate: today,
    employee: user?.regnum,
    type: 3,
    leaveYear: "ALL",
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
    setDraftFilter,
  } = useFilter(initialFilter);
  const subordinate = useMemo(() => {
    return subordinates.map((s) => ({
      label: s.namalengkap.trim(),
      value: s.regnum,
    }));
  }, [subordinates]);
  const activeEmployee = subordinate.find(
    (s) => s.value === activeFilter.employee,
  );
  const fetchLoader = useDelayedLoading();
  const summaryLoader = useDelayedLoading();
  const skeletonLoop = Array.from({ length: 3 });
  const requestIdRef = useRef(0);
  const requestSummaryIdRef = useRef(0);
  const leaveTypes = useLeaveTypeStore((s) => s.leaveTypes);
  const leaveTypeOptions = leaveTypes.map((lt) => ({
    label: lt.nama,
    value: lt.id,
  }));
  const fetchLeaveTypes = useLeaveTypeStore((s) => s.fetchLeaveTypes);
  const loaded = useLeaveTypeStore((s) => s.loaded);
  const [leaveYear, setLeaveYear] = useState([]);

  useEffect(() => {
    if (!user) return;

    setDisplayStDate(formatDateFromPicker(firstDay));
    setDisplayEnDate(formatDateFromPicker(today));
  }, [user]);

  useEffect(() => {
    if (!user || loaded) return;
    fetchLeaveTypes();
    fetchSummary();
    fetchLeaveYear();
  }, [user, loaded]);

  useEffect(() => {
    if (!user) return;
    fetchData();
    fetchSummary();
    fetchLeaveYear();
  }, [user, activeFilter]);

  async function fetchData() {
    const requestId = ++requestIdRef.current;
    fetchLoader.startLoading();
    const params = new URLSearchParams({
      startDate: formatLocalDate(activeFilter.startDate),
      endDate: formatLocalDate(activeFilter.endDate),
      type: activeFilter.type,
      targetRegnum: activeFilter.employee,
      leaveYear: activeFilter.leaveYear,
    });

    await api
      .get(`/leaveUsage/?${params.toString()}`)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setLeaves(res.data);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Failed to Fetch data");
      })
      .finally(() => {
        if (requestId === requestIdRef.current) fetchLoader.stopLoading();
      });
  }

  async function fetchSummary() {
    const requestSummaryId = ++requestSummaryIdRef.current;
    summaryLoader.startLoading();
    await api
      .get(`/leaveUsage/summary`, {
        params: {
          targetRegnum: activeFilter.employee,
        },
      })
      .then((res) => {
        if (requestSummaryId !== requestSummaryIdRef.current) return;
        setSummary(res.data);
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Failed to Fetch Headline Summary",
        );
      })
      .finally(() => {
        if (requestSummaryId === requestSummaryIdRef.current)
          summaryLoader.stopLoading();
      });
  }

  async function fetchLeaveYear() {
    await api
      .get(`/leaveUsage/leaveYear`, {
        params: {
          targetRegnum: activeFilter.employee,
        },
      })
      .then((res) => {
        const options = [
          { label: "ALL", value: "ALL" },
          ...res.data.map((y) => ({
            label: String(y.leave_year),
            value: y.leave_year,
          })),
        ];
        setLeaveYear(options);
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Failed to Fetch Leave Year Filter",
        );
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

  function handleCloseFilter() {
    setFilterPopupOpen(false);
    setTimeout(() => {
      setFilterPopup(null);
    }, 200);
  }

  function handleApplyFilter() {
    applyFilter();

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draftFilter));
  }

  function handleResetFilter() {
    // resetFilter();
    setDraftFilter(defaultFilter);

    setDisplayStDate(formatDateFromPicker(firstDay));
    setDisplayEnDate(formatDateFromPicker(today));
  }

  return (
    <div className="bg-slate-100 flex flex-col flex-1 p-0.5 min-h-0 overflow-auto">
      <HeadPage
        label={"Leave Usage"}
        employeeName={activeEmployee?.label}
        handleClick={handleClickFilter}
      />

      <div className="flex w-full justify-center">
        {summaryLoader.loading ? (
          <div className="text-transparent flex w-full justify-around p-2 rounded-xl outline-1 outline-blue-800 shadow-sm mx-2 max-w-2xl bg-slate-100">
            <div className="flex gap-1.5">
              <p className="skeleton rounded-xl bg-slate-200 text-3xl font-semibold">
                00
              </p>
              <div className="skeleton rounded-xl bg-slate-200 flex text-sm leading-none items-center w-17 font-medium">
                <p>Remaining Leave</p>
              </div>
            </div>
            <div className="border-l border-blue-300 shadow-sm" />
            <div className="flex gap-1.5">
              <p className="skeleton rounded-xl bg-slate-200 text-3xl font-semibold">
                00
              </p>
              <div className="skeleton rounded-xl bg-slate-200 flex text-sm leading-none items-center w-17 font-medium">
                <p>Used This Year</p>
              </div>
            </div>
            <div className="border-l border-blue-300 shadow-sm" />
            <div className="flex gap-1.5">
              <p className="skeleton rounded-xl bg-slate-200 text-3xl font-semibold">
                00
              </p>
              <div className="skeleton rounded-xl bg-slate-200 flex flex-col text-sm leading-none items-center justify-center w-15 font-medium">
                <p className="w-full">Expiring</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full justify-around p-2 rounded-xl outline-1 outline-blue-800 shadow-sm mx-2 max-w-2xl bg-slate-100">
            <div className="flex gap-1.5">
              <p className="text-3xl font-semibold text-blue-600">
                {summary?.remaining?.remaining_leave || "0"}
              </p>
              <div className="flex text-sm leading-none items-center w-17 font-medium text-slate-600">
                <p>Remaining Leave</p>
              </div>
            </div>
            <div className="border-l border-blue-300 shadow-sm" />
            <div className="flex gap-1.5">
              <p className="text-3xl font-semibold text-blue-600">
                {summary?.used?.used_this_year || "0"}
              </p>
              <div className="flex text-sm leading-none items-center w-17 font-medium text-slate-600">
                <p>Used This Year</p>
              </div>
            </div>
            <div className="border-l border-blue-300 shadow-sm" />
            <div className="flex gap-1.5">
              <p className="text-3xl font-semibold text-blue-600">
                {summary?.expiring?.quota || "0"}
              </p>
              <div className="flex flex-col text-sm leading-none items-center justify-center w-15 font-medium text-slate-600">
                <p className="w-full">
                  Expiring{" "}
                  <span className="text-[10px]">
                    {formatDateIndo(summary?.expiring?.expired_at)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-evenly gap-8 m-2 mt-5 md:flex-wrap md:flex-row md:items-start">
        {leaves.length === 0 && !fetchLoader.loading && (
          <div className="font-semibold my-3">
            <p>No Data</p>
          </div>
        )}
        {fetchLoader.loading
          ? skeletonLoop.map((m, index) => (
              <div key={index} className="text-transparent">
                <Card>
                  <div className="flex gap-5">
                    <div className="flex flex-col gap-1 ">
                      <div className="flex gap-1.5 ">
                        <p className="skeleton bg-slate-200 rounded-xl font-semibold text-4xl">
                          00
                        </p>
                        <p className="skeleton bg-slate-200 rounded-xl h-fit font-medium text-lg">
                          Load
                        </p>
                      </div>
                      <div className="skeleton bg-slate-200 rounded-xl flex flex-col text-sm">
                        <p>0 Load - Loading</p>
                        <p>0 Load - Loading</p>
                      </div>
                    </div>
                    <div className="flex flex-1 justify-end border-l pl-3 border-slate-400 ">
                      <div className="flex flex-col flex-1 justify-center gap-1 pt-1">
                        <span className="skeleton bg-slate-200 rounded-xl w-fit select-none p-0.5">
                          <CalendarFold className="size-6" />
                        </span>
                        <div className="skeleton bg-slate-200 rounded-xl flex flex-col justify-end text-sm">
                          <p>Loading Loading Loading </p>
                          <p>Loading</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="text-slate-400 shadow-sm my-3" />
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="skeleton bg-slate-200 rounded-xl flex w-full justify-between ">
                      <p>Loading</p>
                    </div>
                    <div className="skeleton bg-slate-200 rounded-xl flex w-full justify-between ">
                      <p>Loading</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))
          : leaves.map((leave) => (
              <Card key={leave.id}>
                <div className="flex gap-5">
                  <div className="flex flex-col gap-1 ">
                    <div className="flex gap-1.5">
                      <p className="font-semibold text-4xl">
                        {leave.total_days}
                      </p>
                      <p className="font-medium text-lg">
                        {leave.total_days > 1 ? "Days" : "Day"}
                      </p>
                    </div>
                    <div className="flex flex-col text-sm">
                      {leave.quota_usage.map((usage, index) => (
                        <p key={index}>
                          {usage.used_days}{" "}
                          {usage.used_days > 1 ? "Days" : "Day"} - Cuti{" "}
                          {usage.year}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 justify-end border-l pl-3 border-slate-400 ">
                    <div className="flex flex-col flex-1 justify-center gap-1 pt-1">
                      {/* <span className="material-symbols-outlined text-3xl! select-none bg-amber-200">
                        event
                      </span> */}
                      <span className="select-none p-0.5">
                        <CalendarFold className="size-6" />
                      </span>
                      <div className="flex flex-col justify-end text-sm">
                        <p>{formatDateIndo(leave.tgl1, "long")}</p>
                        <p
                          className={
                            leave.tgl2 === leave.tgl1 ? "hidden" : "flex"
                          }
                        >
                          ↳ {formatDateIndo(leave.tgl2, "long")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="text-slate-400 shadow-sm my-3" />
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex w-full justify-between ">
                    <p>Notes</p>
                    <p className=" w-55 text-right">{leave.keterangan}</p>
                  </div>
                  <div className="flex w-full justify-between ">
                    <p>Req. Date</p>
                    <p>{formatDateIndo(leave.log_date)}</p>
                  </div>
                </div>
              </Card>
            ))}
      </div>

      {filterPopup && (
        <FilterPopup
          position={filterPopup.rect}
          open={filterPopupOpen}
          handleClose={handleCloseFilter}
          handleResetFilter={handleResetFilter}
          handleApplyFilter={handleApplyFilter}
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
          {subordinate.length > 1 && (
            <FilterSelect
              label="Employee"
              id="employee"
              options={subordinate}
              value={draftFilter.employee}
              handleValueChange={(v) => setField("employee", v)}
            />
          )}
          <FilterSelect
            label="Status"
            id="status"
            options={leaveTypeOptions}
            value={draftFilter.type}
            handleValueChange={(v) => setField("type", v)}
          />
          <div
            className={`transition-all duration-300 ease-in-out space-y-2
                ${
                  draftFilter.type === 3
                    ? "opacity-100 max-h-60 pointer-events-auto"
                    : "opacity-0 max-h-0 -translate-y-5 pointer-events-none"
                }`}
          >
            <FilterSelect
              label="Tahun Cuti"
              id="tahunCuti"
              options={leaveYear}
              value={draftFilter.leaveYear}
              handleValueChange={(v) => setField("leaveYear", v)}
            />
          </div>
        </FilterPopup>
      )}
    </div>
  );
}
