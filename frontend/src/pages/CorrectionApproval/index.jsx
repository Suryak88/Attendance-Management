import { useContext, useEffect, useRef, useState } from "react";
import Button from "../../components/atoms/Button";
import { approvalStatusConfig } from "../../utils/statusColor";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import {
  formatDateFromPicker,
  formatDateIndo,
  formatLocalDate,
  isoUTCToTime,
  mergeTimeToDate,
} from "../../utils/Date";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FormContent from "../../components/organisms/Modal/contents/FormContent";
import Modal from "../../components/organisms/Modal";
import { useModal } from "../../hooks/useModal";
import Card from "../../components/organisms/Card";
import FloatingTextArea from "../../components/atoms/FloatingTextArea";
import FormSuccess from "../../components/organisms/Modal/contents/FormSuccess";
import { enrichCorrection } from "../../utils/correctionFormatter";
import { toast } from "sonner";
import { useFilter } from "../../hooks/useFilter";
import TableChild from "../../components/atoms/TableChild";
import FilterPopup from "../../components/organisms/FilterPopUp";
import FilterDate from "../../components/organisms/FilterPopUp/contents/FilterDate";
import FilterSelect from "../../components/organisms/FilterPopUp/contents/FIlterSelect";
import { FilterStatusApproval } from "../../data/FilterStatusApproval";
import HeadPage from "../../components/organisms/HeadPage";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import FloatingTime from "../../components/atoms/FloatingTime";
import BtnLoading from "../../components/atoms/BtnLoading";
import ActionFormSection from "../../components/organisms/ActionFormSection";
import { Check, EllipsisVertical, Pencil, X } from "lucide-react";
import { columns } from "../../data/correctionApprovalTableHead";
import CheckBox from "../../components/atoms/CheckBox";
import PopUpMenu from "../../components/organisms/PopUpMenu";
import SidebarButton from "../../components/atoms/SidebarButton";

export default function CorrectionApproval() {
  const { user, subordinates } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionMode, setActionMode] = useState(null);
  const { open, close, openModal, showSuccess, mode } = useModal(resetForm);
  const statusConfig = approvalStatusConfig[selectedRequest?.fl_approve];
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [displayStDate, setDisplayStDate] = useState("");
  const [displayEnDate, setDisplayEnDate] = useState("");
  const [filterPopup, setFilterPopup] = useState(null);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const subordinate = subordinates
    .filter((s) => s.regnum !== user?.regnum)
    .map((s) => ({
      label: s.namalengkap.trim(),
      value: s.regnum,
    }));
  const employeeOptions = [{ label: "All", value: "all" }, ...subordinate];
  const STORAGE_KEY = "correction-approval-filter";
  const savedFilter = sessionStorage.getItem(STORAGE_KEY);
  const defaultFilter = {
    startDate: firstDay,
    endDate: today,
    employee: "all",
    status: "all",
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
  const activeEmployee = employeeOptions.find(
    (s) => s.value === activeFilter.employee,
  );
  const { loading, startLoading, stopLoading } = useDelayedLoading();
  const submitLoader = useDelayedLoading();
  const submitBulkLoader = useDelayedLoading();
  const skeletonLoop = Array.from({ length: 5 });
  const requestIdRef = useRef(0);
  const [adjustTime, setAdjustTime] = useState({
    clockIn: null,
    clockOut: null,
  });
  const [isEdit, setIsEdit] = useState(false);
  const [popup, setPopup] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [rowPopup, setRowPopup] = useState(null);
  const [rowPopupOpen, setRowPopupOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  const [lateExcused, setLateExcused] = useState(false);
  const [earlyLeaveExcused, setEarlyLeaveExcused] = useState(false);
  const canExcuseLate =
    ["ISI_ABSEN_MASUK", "ISI_ABSEN_MASUK_PULANG"].includes(
      selectedRequest?.correction_type,
    ) && selectedRequest?.telat > 0;
  const canExcuseEarlyLeave =
    ["ISI_ABSEN_PULANG", "ISI_ABSEN_MASUK_PULANG"].includes(
      selectedRequest?.correction_type,
    ) && selectedRequest?.pulang_cepat > 0;

  useEffect(() => {
    if (!user) return;

    setDisplayStDate(formatDateFromPicker(firstDay));
    setDisplayEnDate(formatDateFromPicker(today));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCorrectionRequests();
  }, [user, activeFilter]);

  useEffect(() => {
    handleAdjustTime();
  }, [selectedRequest]);

  useEffect(() => {
    if (isEdit === false) handleAdjustTime();
  }, [isEdit]);

  useEffect(() => {
    if (!rowPopup) return;

    const handleScroll = () => handleCloseRowPopup();

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [rowPopup]);

  function handleAdjustTime() {
    if (selectedRequest?.correction_type === "ISI_ABSEN_MASUK_PULANG") {
      setAdjustTime({
        clockIn: selectedRequest?.thumbnail.clockIn,
        clockOut: selectedRequest?.thumbnail.clockOut,
      });
    } else if (selectedRequest?.correction_type === "ISI_ABSEN_MASUK") {
      setAdjustTime({
        clockIn: selectedRequest?.thumbnail.clockIn,
        clockOut: null,
      });
    } else if (selectedRequest?.correction_type === "ISI_ABSEN_PULANG") {
      setAdjustTime({
        clockIn: null,
        clockOut: selectedRequest?.thumbnail.clockOut,
      });
    }
  }

  async function fetchCorrectionRequests() {
    const requestId = ++requestIdRef.current;
    startLoading();

    const params = new URLSearchParams({
      startDate: formatLocalDate(activeFilter.startDate),
      endDate: formatLocalDate(activeFilter.endDate),
      status: activeFilter.status,
    });
    if (activeFilter.employee && activeFilter.employee !== "all")
      params.append("targetRegnum", activeFilter.employee);

    await api
      .get(`/correctionApproval/?${params.toString()}`)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;

        const enrichedData = res.data.map(enrichCorrection);
        setRequests(enrichedData);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Failed to fetch data!");
      })
      .finally(() => {
        if (requestId === requestIdRef.current) stopLoading();
      });
  }

  async function submitApprove(e) {
    const adjustedClockIn = mergeTimeToDate(
      new Date(selectedRequest?.tgl),
      adjustTime.clockIn,
    );
    const adjustedClockOut = mergeTimeToDate(
      new Date(selectedRequest?.tgl),
      adjustTime.clockOut,
    );
    try {
      submitLoader.startLoading();
      await api.put(`/correctionApproval/approve/${selectedRequest.id}`, {
        clockIn: adjustedClockIn,
        clockOut: adjustedClockOut,
        lateExcused,
        earlyLeaveExcused,
      });
      removeFromCheckedIds(selectedRequest.id);
      await fetchCorrectionRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function handleSubmitApprove(e) {
    e.preventDefault();

    const originalIn = isoUTCToTime(selectedRequest?.masuk) || null;
    const originalOut = isoUTCToTime(selectedRequest?.pulang) || null;

    let isChanged = false;

    switch (selectedRequest?.correction_type) {
      case "ISI_ABSEN_MASUK":
        isChanged = originalIn !== adjustTime.clockIn && isEdit;
        break;
      case "ISI_ABSEN_PULANG":
        isChanged = originalOut !== adjustTime.clockOut && isEdit;
        break;
      case "ISI_ABSEN_MASUK_PULANG":
        isChanged =
          (originalIn !== adjustTime.clockIn ||
            originalOut !== adjustTime.clockOut) &&
          isEdit;
        break;

      default:
        isChanged = false;
    }

    if (isChanged) {
      toast.warning("Submit dengan waktu yang disesuaikan?", {
        duration: Infinity,
        action: {
          label: "Ya",
          onClick: () => submitApprove(),
        },
        cancel: {
          label: "Batal",
        },
      });

      return;
    }

    await submitApprove();
  }

  async function submitReject(e) {
    e.preventDefault();
    if (!rejectNotes || rejectNotes.trim() === "") {
      toast.error("Silahkan isi rejection notes");
      return;
    }

    try {
      submitLoader.startLoading();
      await api.put(`/correctionApproval/reject/${selectedRequest.id}`, {
        notes: rejectNotes,
      });
      removeFromCheckedIds(selectedRequest.id);
      await fetchCorrectionRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function submitBulkApprove(e) {
    e.preventDefault();

    try {
      submitBulkLoader.startLoading();
      await api.put(`/correctionApproval/bulk-approve`, {
        ids: checkedIds,
      });

      setCheckedIds([]);
      await fetchCorrectionRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to approve!");
    } finally {
      submitBulkLoader.stopLoading();
    }
  }

  function resetForm() {
    setSelectedRequest(null);
    setActionMode(null);
    setRejectNotes("");
    setIsEdit(false);
    toast.dismiss();
    setAdjustTime({
      clockIn: null,
      clockOut: null,
    });
  }

  function handleClose() {
    close();
    setTimeout(() => {
      resetForm();
    }, 300);
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

  function handleChangeAdjustTime(r, field) {
    setAdjustTime((prev) => ({
      ...prev,
      [field]: r,
    }));
  }

  function handleClickMoreRow(e, index, item) {
    e.stopPropagation();
    if (rowPopup?.index === index && rowPopupOpen) {
      handleCloseRowPopup();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    setRowPopup({
      index,
      item,
      rect,
    });
    setRowPopupOpen(false);

    requestAnimationFrame(() => {
      setRowPopupOpen(true);
    });
  }

  function handleCloseRowPopup() {
    setRowPopupOpen(false);
    setTimeout(() => {
      setRowPopup(null);
    }, 200);
  }

  function handleCheckAll() {
    const pendingIds = requests
      .filter((req) => req.fl_approve === 0)
      .map((req) => req.id);

    const allChecked = pendingIds.every((id) => checkedIds.includes(id));

    if (allChecked) {
      setCheckedIds((prev) => prev.filter((id) => !pendingIds.includes(id)));
      return;
    }

    setCheckedIds((prev) => [...new Set([...prev, ...pendingIds])]);
  }

  function removeFromCheckedIds(id) {
    setCheckedIds((prev) => prev.filter((itemId) => itemId !== id));
  }

  function handleClickDetail(item) {
    fetchLeaveQuota(item.regnum, item.tgl1);
    openModal();
    setSelectedRequest(item);
    setRejectNotes(item.rejection_notes || item.revision_rejection_notes || "");
  }

  function handleToggleCheck(id, status) {
    if (status !== 0) return;
    if (submitBulkLoader.loading) return;

    setCheckedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      }
      return [...prev, id];
    });
  }

  return (
    <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0">
      <HeadPage
        label={"Attendance Correction Approval"}
        employeeName={activeEmployee?.label}
        handleClick={handleClickFilter}
      />

      <div className="w-full flex flex-col flex-1 space-y-2 min-h-0">
        <div className="flex mx-2 px-1 gap-2">
          <button
            className="flex px-2 py-1 bg-slate-100 rounded-xl shadow-sm font-medium text-xs lg:text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md items-center gap-2 disabled:text-black/40"
            onClick={handleCheckAll}
            disabled={submitBulkLoader.loading}
          >
            Check All
            <Check size={16} />
          </button>
          <button
            className={`px-2 py-1 w-35 md:w-40 bg-slate-100 rounded-xl shadow-sm font-medium text-xs lg:text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md items-center ${checkedIds.length < 1 ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"} transition-all disabled:text-black/40`}
            onClick={submitBulkApprove}
            disabled={submitBulkLoader.loading}
          >
            {submitBulkLoader.loading ? (
              <div className="flex w-full justify-center">
                <BtnLoading label={"Processing"} />
              </div>
            ) : (
              <div>
                Approve {checkedIds.length}{" "}
                {checkedIds.length > 1 ? "Requests" : "Request"}
              </div>
            )}
          </button>
        </div>

        <div className="flex bg-red-400 text-white p-2 mx-2 rounded-2xl font-bold">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`flex-1 text-center text-[13px] md:text-sm xl:text-base ${
                col.flexSize ?? "flex-1"
              }`}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* <div className="w-full flex flex-1 flex-col flex-wrap md:flex-row items-center p-2 justify-evenly gap-y-8"> */}
        <div className="flex-1 min-h-0 overflow-auto space-y-2 pb-4">
          {requests.length === 0 && !loading && (
            <div className="font-semibold my-3">
              <TableChild>No Data</TableChild>
            </div>
          )}
          {loading
            ? skeletonLoop.map((r, index) => (
                <div
                  key={index}
                  className={`skeleton flex px-1 py-2 md:p-2 mx-2 rounded-2xl items-center min-h-0 bg-red-100 text-transparent`}
                >
                  <TableChild>Loading</TableChild>
                </div>
              ))
            : requests.map((request, index) => (
                <div
                  key={index}
                  className={`flex px-1 py-2 md:p-2 mx-2 rounded-2xl items-center min-h-0 bg-red-100`}
                >
                  <TableChild>
                    <div className="flex justify-start w-full max-w-25 xl:max-w-40 xl:gap-2">
                      <CheckBox
                        id={"Chck"}
                        label={request?.namalengkap}
                        truncateSize={"5"}
                        truncateDot={false}
                        status={request?.fl_approve}
                        checked={checkedIds.includes(request?.id)}
                        onClick={() =>
                          handleToggleCheck(request?.id, request?.fl_approve)
                        }
                      />
                    </div>
                  </TableChild>
                  <TableChild>
                    {request?.thumbnail.label} - {request?.thumbnail.value}
                  </TableChild>
                  <TableChild>{formatDateIndo(request?.tgl)}</TableChild>
                  <TableChild flexSize="flex-[0.2]">
                    {/* <span
                      className={`ignore-popup-close material-symbols-outlined rounded-full hover:bg-red-300 cursor-pointer leading-none p-0.5 xl:p-1 transition-all duration-200 select-none ${
                        rowPopup?.index === index ? "bg-red-300" : ""
                      }`}
                      style={{
                        fontVariationSettings:
                          "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                      }}
                      onClick={(e) => handleClickMoreRow(e, index, request)}
                    >
                      more_vert
                    </span> */}
                    <div
                      className={`ignore-popup-close flex items-center rounded-full hover:bg-red-300 cursor-pointer leading-none p-1 xl:p-1 transition-all duration-200 select-none ${
                        rowPopup?.index === index ? "bg-red-300" : ""
                      }`}
                      onClick={(e) => handleClickMoreRow(e, index, request)}
                    >
                      <EllipsisVertical className="size-5" />
                    </div>
                  </TableChild>
                </div>
              ))}

          {/* {loading DESIGN CARD TIDAK JADI PAKAI
            ? skeletonLoop.map((m, index) => (
                <Card key={index}>
                  <div className="text-transparent">
                    <div className="flex justify-between">
                      <h3 className="skeleton rounded-2xl bg-slate-200 px-2 font-medium text-lg">
                        Loading
                      </h3>
                      <div
                        className={`skeleton px-2 py-0.5 mt-1 rounded-full outline-none bg-slate-200 text-sm h-fit`}
                      >
                        Loading
                      </div>
                    </div>

                    <div className="skeleton flex flex-col rounded-xl mt-5 p-2 gap-2 bg-slate-200 outline-1 outline-slate-300 shadow-sm text-sm">
                      <p>Request:</p>
                      <p className="text-lg text-center font-medium">Loading</p>
                    </div>
                    <div className="flex flex-col rounded-xl p-2 gap-2 text-sm my-1">
                      <div className="skeleton flex justify-between rounded-2xl bg-slate-200">
                        <p>Date:</p>
                      </div>
                      <div className="skeleton flex justify-between rounded-2xl bg-slate-200">
                        <p>Type:</p>
                      </div>
                    </div>

                    <div className="mt-4 flex mb-2">
                      <Button
                        btnLabel={"View Details"}
                        btnColor="skeleton bg-slate-200 outline-none"
                        textSize="text-sm shadow-sm!"
                      />
                    </div>
                  </div>
                </Card>
              ))
            : requests.map((request) => (
                <Card key={request.id}>
                  <div className="flex justify-between">
                    <h3 className="font-medium text-lg">
                      {request?.namalengkap}
                    </h3>
                    <div
                      className={`px-2 py-0.5 mt-1 rounded-full outline-1 text-sm h-fit ${
                        approvalStatusConfig[request?.fl_approve]?.badgeClass ??
                        ""
                      }`}
                    >
                      {approvalStatusConfig[request?.fl_approve]?.label ?? ""}
                    </div>
                  </div>

                  <div className="flex flex-col rounded-xl mt-5 p-2 gap-2 outline-1 outline-slate-400 shadow-sm text-sm">
                    <p>Request:</p>
                    <p className="text-lg text-center font-medium">
                      {request?.thumbnail.label} - {request?.thumbnail.value}
                    </p>
                  </div>
                  <div className="flex flex-col rounded-xl p-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <p>Date:</p>
                      <p>{formatDateIndo(request?.tgl)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Type:</p>
                      <p>{request?.thumbnail.name}</p>
                    </div>
                    <div className="flex justify-between"> </div>
                  </div>

                  <div className="mt-4 flex mb-2">
                    <Button
                      btnLabel={"View Details"}
                      btnColor="outline-1 outline-slate-300 hover:outline-slate-500 hover:text-black/60!"
                      textSize="text-base shadow-sm!"
                      handleClick={() => {
                        openModal();
                        setSelectedRequest(request);
                        setRejectNotes(request.rejection_notes ?? "");
                      }}
                    />
                  </div>
                </Card>
              ))} */}
        </div>
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
            options={FilterStatusApproval}
            value={draftFilter.status}
            handleValueChange={(v) => setField("status", v)}
          />
        </FilterPopup>
      )}

      <Modal
        openModal={open}
        onClose={handleClose}
        contentWidth={mode === "form" ? "w-7/8 lg:w-md" : "w-3/4 lg:w-fit"}
      >
        {mode === "form" && (
          <div
            className={`w-full transition-all duration-300 ${
              mode === "form" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ModalPanel
              title={selectedRequest?.namalengkap}
              titlePosition="text-left"
              subtitle={
                selectedRequest?.departemen_id
                  ? `${selectedRequest?.jabatan}`
                  : `${selectedRequest?.jabatan} - ${selectedRequest?.departemen}`
              }
              handleClose={handleClose}
              badgeColor={statusConfig?.badgeClass ?? ""}
              badgeLabel={statusConfig?.label ?? ""}
            >
              <FormContent>
                <div className="flex w-full flex-col">
                  <div className="flex flex-1 w-full text-base font-medium mb-1">
                    <p>{selectedRequest?.thumbnail.label}</p>
                  </div>
                  <div
                    className={`flex justify-around rounded-xl p-2 gap-2 outline-1 outline-slate-400 shadow-sm font-medium transition-all duration-300 ease-in-out 
                      ${isEdit ? "max-h-35" : "max-h-24"}`}
                  >
                    <div className="flex flex-col justify-center text-center">
                      <p className="text-sm text-slate-500">Date</p>
                      <p className="text-base lg:hidden">
                        {formatDateIndo(selectedRequest?.tgl)}
                      </p>
                      <p className="text-lg hidden lg:flex">
                        {formatDateIndo(selectedRequest?.tgl, "long")}
                      </p>
                    </div>
                    <div
                      className={`flex justify-center items-center text-center gap-1 transition-all duration-300`}
                    >
                      <div
                        className={`flex flex-col my-1.5 transition-all duration-300 ease-in-out ${isEdit ? "opacity-0 max-w-0 translate-x-10" : "opacity-100 max-w-31"}`}
                      >
                        <p className="text-sm text-slate-500">
                          {selectedRequest?.thumbnail.label}
                        </p>
                        <p className="text-base lg:text-lg">
                          {selectedRequest?.thumbnail.time ??
                            selectedRequest?.thumbnail.value}
                        </p>
                      </div>

                      <div
                        className={`flex flex-col transition-all duration-300 ${isEdit ? "opacity-100 max-w-31" : "opacity-0 max-w-0 -translate-x-10"}`}
                      >
                        {adjustTime.clockIn !== null && (
                          <FloatingTime
                            id={"adjustIn"}
                            label="Clock In"
                            value={adjustTime.clockIn}
                            onChange={(r) =>
                              handleChangeAdjustTime(r, "clockIn")
                            }
                            displayValue={adjustTime.clockIn}
                            setDisplayValue={(r) =>
                              handleChangeAdjustTime(r, "clockIn")
                            }
                            fontThickness="font-normal"
                            border="border"
                          />
                        )}

                        {adjustTime.clockOut !== null && (
                          <FloatingTime
                            id={"adjustOut"}
                            label="Clock Out"
                            value={adjustTime.clockOut}
                            onChange={(r) =>
                              handleChangeAdjustTime(r, "clockOut")
                            }
                            displayValue={adjustTime.clockOut}
                            setDisplayValue={(r) =>
                              handleChangeAdjustTime(r, "clockOut")
                            }
                            fontThickness="font-normal"
                            border="border"
                          />
                        )}
                      </div>
                      {selectedRequest?.fl_approve === 0 &&
                        !selectedRequest?.correction_type?.startsWith(
                          "IZIN",
                        ) && (
                          <div className="flex flex-col">
                            <span
                              title="Cancel Adjustment"
                              className={`rounded-full p-1 leading-none transition-all duration-300 ease-in-out select-none cursor-pointer bg-red-100 hover:text-black/70 hover:bg-red-200 
                              ${isEdit ? "opacity-100 -translate-y-1 scale-100" : "opacity-0 translate-y-7 scale-0"}`}
                              onClick={() => setIsEdit(false)}
                            >
                              <X className="size-5" />
                            </span>
                            <span
                              title="Adjust Time"
                              className={`flex justify-center rounded-full px-1 py-1.5 leading-none transition-all duration-300 ease-in-out select-none cursor-pointer hover:text-black/70 hover:bg-slate-200 ${isEdit ? "bg-slate-300" : "-translate-y-2"}`}
                              onClick={() => setIsEdit(!isEdit)}
                            >
                              <Pencil className="size-4" />
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="flex flex-col p-2 gap-2 text-sm mt-1">
                    <div className="flex justify-between">
                      <p>Req. Date:</p>
                      <p className="text-right">
                        {formatDateIndo(selectedRequest?.log_date)}
                      </p>
                    </div>
                    {selectedRequest?.telat > 0 &&
                      selectedRequest.correction_type !== "ISI_ABSEN_PULANG" &&
                      selectedRequest?.correction_type !==
                        "IZIN_PULANG_CEPAT" && (
                        <div className="flex justify-between">
                          <p>Late:</p>
                          <p>{selectedRequest?.lateFormatted}</p>
                        </div>
                      )}
                    {selectedRequest?.pulang_cepat > 0 &&
                      selectedRequest?.correction_type !== "ISI_ABSEN_MASUK" &&
                      selectedRequest?.correction_type !== "IZIN_TELAT" && (
                        <div className="flex justify-between">
                          <p>Early Leave:</p>
                          <p>{selectedRequest?.earlyLeaveFormatted}</p>
                        </div>
                      )}
                    <div className="flex justify-between gap-10">
                      <p>Desc:</p>
                      <p className="text-right">
                        {selectedRequest?.keterangan}
                      </p>
                    </div>

                    {canExcuseLate && (
                      <div className="flex w-full gap-2 mt-2">
                        <CheckBox
                          id={"late-excused"}
                          label={"Tandai sebagai telat berizin"}
                          isTruncate={false}
                          // status={selectedRequest?.fl_approve}
                          checked={lateExcused}
                          onClick={() => {
                            if (selectedRequest?.fl_approve === 0)
                              setLateExcused((prev) => !prev);
                          }}
                        />
                      </div>
                    )}

                    {canExcuseEarlyLeave && (
                      <div className="flex w-full gap-2 mt-2">
                        <CheckBox
                          id={"early-leave-excused"}
                          label={"Tandai sebagai pulang cepat berizin"}
                          isTruncate={false}
                          // status={selectedRequest?.fl_approve}
                          checked={earlyLeaveExcused}
                          onClick={() => {
                            if (selectedRequest?.fl_approve === 0)
                              setEarlyLeaveExcused((prev) => !prev);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* <div
                  className={`w-full space-y-5 transition-all duration-500 ease-in-out
                              ${
                                actionMode === "reject" ||
                                selectedRequest?.fl_approve == 2
                                  ? "opacity-100 translate-y-0 max-h-60 pointer-events-auto"
                                  : "opacity-0 -translate-y-4 max-h-0 pointer-events-none"
                              }`}
                >
                  <hr className="text-slate-400" />
                  <FloatingTextArea
                    id="Reject Notes"
                    value={rejectNotes}
                    onValueChange={setRejectNotes}
                    message={"Please enter the rejection notes"}
                    border="border rounded-xl! shadow-sm"
                    borderColorDefault="border-slate-400"
                    inputFontThickness="font-normal"
                    labelFontThickness="font-normal"
                    isDisable={!!selectedRequest?.rejection_notes}
                  />
                </div>
                {actionMode === "reject" && (
                  <div className="flex gap-12 mt-5">
                    <Button
                      btnLabel={"Cancel"}
                      handleClick={() => {
                        setActionMode(null);
                      }}
                      btnColor="bg-slate-300 hover:bg-slate-400 outline-1 outline-slate-600"
                      btnWidth=""
                    />
                    <Button
                      btnLabel={"Reject"}
                      handleClick={submitReject}
                      btnColor="bg-red-300 hover:bg-red-400 outline-1 outline-red-600"
                      btnWidth=""
                    />
                  </div>
                )} */}
                <ActionFormSection
                  actionMode={actionMode}
                  appear={
                    actionMode === "reject" || selectedRequest?.fl_approve == 2
                  }
                  btnLabel={actionMode}
                  handleCancel={() => setActionMode(null)}
                  handleClick={submitReject}
                  loading={submitLoader.loading}
                  noteIsDisable={!!selectedRequest?.rejection_notes}
                  notesLabel={"Reject Notes"}
                  notesValue={rejectNotes}
                  setNotesValue={setRejectNotes}
                />

                {actionMode != "reject" && selectedRequest?.fl_approve == 0 && (
                  <div className={`flex gap-12 mt-5 transition-all `}>
                    <Button
                      btnTitle="Reject Request"
                      btnLabel={
                        <span>
                          <X />
                        </span>
                      }
                      btndisable={submitLoader.loading}
                      btnColor="bg-red-300 hover:bg-red-400 outline-1 outline-red-600 disabled:bg-slate-300 disabled:outline-slate-400 disabled:text-black/40 transition-all"
                      withIcon="leading-none"
                      btnWidth=""
                      handleClick={() => setActionMode("reject")}
                    />
                    <Button
                      btnTitle="Approve Request"
                      btnLabel={
                        submitLoader.loading ? (
                          <div className="px-1 py-0.5">
                            <BtnLoading />
                          </div>
                        ) : (
                          <span>
                            <Check />
                          </span>
                        )
                      }
                      btndisable={submitLoader.loading}
                      btnColor="bg-green-300 hover:bg-green-400 outline-1 outline-green-600"
                      withIcon="leading-none"
                      btnWidth=""
                      handleClick={handleSubmitApprove}
                    />
                  </div>
                )}
              </FormContent>
            </ModalPanel>
          </div>
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
                actionMode === "reject"
                  ? "Request rejected!"
                  : "Request approved!"
              }
              handleClose={close}
            >
              <FormSuccess />
              <Button handleClick={close} btnLabel={"OK"} btnWidth="" />
            </ModalPanel>
          </div>
        )}
      </Modal>

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
              setSelectedRequest(rowPopup.item);
              setRejectNotes(rowPopup.item.rejection_notes ?? "");
              setLateExcused(rowPopup.item.late_excused ?? 0);
              setEarlyLeaveExcused(rowPopup.item.early_leave_excused ?? 0);
            }}
          />
        </PopUpMenu>
      )}
    </div>
  );
}
