import { useContext, useEffect, useRef } from "react";
import TableChild from "../../components/atoms/TableChild";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import { useState } from "react";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FormSuccess from "../../components/organisms/Modal/contents/FormSuccess";
import { useModal } from "../../hooks/useModal";
import FormContent from "../../components/organisms/Modal/contents/FormContent";
import Button from "../../components/atoms/Button";
import {
  countWorkingDays,
  formatDateFromPicker,
  formatDateIndo,
  formatDateRangeIndo,
  formatLocalDate,
  parseLocalDate,
} from "../../utils/Date";
import FloatingTextArea from "../../components/atoms/FloatingTextArea";
import { approvalStatusConfig } from "../../utils/statusColor";
import Card from "../../components/organisms/Card";
import { toast } from "sonner";
import { useHoliday } from "../../context/HolidayContext";
import { useFilter } from "../../hooks/useFilter";
import FilterPopup from "../../components/organisms/FilterPopUp";
import FilterDate from "../../components/organisms/FilterPopUp/contents/FilterDate";
import FilterSelect from "../../components/organisms/FilterPopUp/contents/FIlterSelect";
import { FilterStatusApproval } from "../../data/FilterStatusApproval";
import HeadPage from "../../components/organisms/HeadPage";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import PopUpMenu from "../../components/organisms/PopUpMenu";
import BtnLoading from "../../components/atoms/BtnLoading";
import { extractErrorMessage } from "../../utils/extractErrorBlob";
import ActionFormSection from "../../components/organisms/ActionFormSection";
import CheckBox from "../../components/atoms/CheckBox";
import {
  Check,
  SquarePen,
  Pen,
  PenLine,
  EllipsisVertical,
  ArrowRight,
  Info,
  X,
  File,
} from "lucide-react";
import { columns } from "../../data/leaveApprovalTableHead";
import { truncateText } from "../../utils/truncateText";
import SidebarButton from "../../components/atoms/SidebarButton";
import { FloatingPortal } from "@floating-ui/react";
import AttachmentPreview from "../../components/organisms/AttachmentPreview";

export default function LeaveApproval() {
  const { user, subordinates } = useContext(AuthContext);
  const [request, setRequest] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionMode, setActionMode] = useState(null);
  const { open, close, openModal, showSuccess, mode } = useModal(resetForm);
  const statusConfig = approvalStatusConfig[selectedRequest?.fl_approve];
  const { holidaySet } = useHoliday();
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
  const STORAGE_KEY = "leave-approval-filter";
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
  const pdfLoader = useDelayedLoading();
  const submitBulkLoader = useDelayedLoading();
  const previewFileLoader = useDelayedLoading();
  const skeletonLoop = Array.from({ length: 5 });
  const requestIdRef = useRef(0);
  const [cutiDetail, setCutiDetail] = useState([]);
  const [leaveQuota, setLeaveQuota] = useState(0);
  const [popup, setPopup] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [rowPopup, setRowPopup] = useState(null);
  const [rowPopupOpen, setRowPopupOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  const [previewFiles, setPreviewFiles] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    if (!user) return;

    setDisplayStDate(formatDateFromPicker(firstDay));
    setDisplayEnDate(formatDateFromPicker(today));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchLeaveRequests();
  }, [user, activeFilter]);

  useEffect(() => {
    if (!rowPopup) return;

    const handleScroll = () => handleCloseRowPopup();

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [rowPopup]);

  async function fetchLeaveRequests() {
    const requestId = ++requestIdRef.current;

    startLoading();
    const params = new URLSearchParams({
      startDate: formatLocalDate(activeFilter.startDate),
      endDate: formatLocalDate(activeFilter.endDate),
      status: activeFilter.status,
    });

    if (activeFilter.employee && activeFilter.employee !== "all")
      params.append("targetRegnum", activeFilter.employee);

    api
      .get(`/leaveApproval/?${params.toString()}`)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;

        const enrichedData = res.data.map((item) => ({
          ...item,
          duration: countWorkingDays(
            parseLocalDate(item.tgl1),
            parseLocalDate(item.tgl2),
            holidaySet,
          ),
        }));
        setRequest(enrichedData);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error?.response?.data?.message || "Failed to fetch data!");
      })
      .finally(() => {
        if (requestId === requestIdRef.current) stopLoading();
      });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isLeavePending(selectedRequest)) return approveLeave();
    if (isRevisionPending(selectedRequest)) return approveRevision();
  }

  async function fetchLeaveQuota(regnum, date) {
    await api
      .get(`leaveRequest/quota/`, {
        params: {
          targetRegnum: regnum,
          date,
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

  async function approveLeave() {
    try {
      submitLoader.startLoading();
      await api.put(`/leaveApproval/approve/${selectedRequest.id}`);
      await fetchLeaveRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function approveRevision() {
    try {
      submitLoader.startLoading();

      await api.put(
        `/leaveApproval/approve/rev/${selectedRequest.revision_id}`,
      );
      await fetchLeaveRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  function isRevisionPending(req) {
    return req?.fl_approve === 1 && req?.new_tgl2 && req?.revision_status === 0;
  }

  function isLeavePending(req) {
    return req?.fl_approve === 0 && req?.new_tgl2 === null;
  }

  function handleReject(e) {
    e.preventDefault();
    if (!rejectNotes || rejectNotes.trim() === "") {
      toast.error("Silahkan isi rejection notes");
      return;
    }

    if (isLeavePending(selectedRequest)) return rejectLeave();
    if (isRevisionPending(selectedRequest)) return rejectRevision();
  }

  async function rejectLeave() {
    try {
      submitLoader.startLoading();
      await api.put(`/leaveApproval/reject/${selectedRequest.id}`, {
        notes: rejectNotes,
      });
      await fetchLeaveRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function rejectRevision() {
    try {
      submitLoader.startLoading();

      await api.put(
        `/leaveApproval/reject/rev/${selectedRequest.revision_id}`,
        {
          notes: rejectNotes,
        },
      );
      await fetchLeaveRequests();
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
      await api.put(`/leaveApproval/bulk-approve`, {
        ids: checkedIds,
      });

      setCheckedIds([]);
      await fetchLeaveRequests();
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
    if (previewFiles) {
      URL.revokeObjectURL(previewFiles);
    }
    setPreviewFiles(null);
  }

  function handleClose() {
    setPopupOpen(false);
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

  function handleCutiDetail(e, index, item) {
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

  async function handleGeneratePDF(e) {
    e.preventDefault();
    const fileName = `${selectedRequest?.leaveName} - ${selectedRequest?.fullname}.pdf`;

    try {
      pdfLoader.startLoading();

      const res = await api.post(
        `/leaveRequest/generatePDF/${selectedRequest?.id}`,
        {
          targetRegnum: selectedRequest?.regnum,
        },
        { responseType: "blob" },
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

  async function handleRevoke(e) {
    e.preventDefault();
    if (!rejectNotes || rejectNotes.trim() === "") {
      toast.error("Silahkan isi revoke notes");
      return;
    }

    try {
      submitLoader.startLoading();

      await api.put(`leaveApproval/revoke/${selectedRequest?.id}`, {
        notes: rejectNotes,
      });
      await fetchLeaveRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  function getSuccessModalTitle() {
    if (actionMode === "reject") return "Request Rejected!";
    if (actionMode === "revoke") return "Request Revoked!";
    return "Request approved!";
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

  function handleCheckAll() {
    const pendingIds = request
      .filter((req) => req.fl_approve === 0)
      .map((req) => req.id);

    const allChecked = pendingIds.every((id) => checkedIds.includes(id));

    if (allChecked) {
      setCheckedIds((prev) => prev.filter((id) => !pendingIds.includes(id)));
      return;
    }

    setCheckedIds((prev) => [...new Set([...prev, ...pendingIds])]);
  }

  async function handleClickDetail(item) {
    fetchLeaveQuota(item.regnum, item.tgl1);
    openModal();
    setSelectedRequest(item);
    setRejectNotes(item.rejection_notes || item.revision_rejection_notes || "");
    await getMedicalCertificate(item);
  }

  async function getMedicalCertificate(item) {
    if (!item?.medical_certificate_name) return;

    try {
      if (previewFiles) {
        URL.revokeObjectURL(previewFiles);
      }
      previewFileLoader.startLoading();

      const res = await api.get(`leaveRequest/medicalCertif/${item?.id}`, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(res.data);

      setPreviewFiles(url);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch medical certificate",
      );
    } finally {
      previewFileLoader.stopLoading();
    }
  }

  return (
    <>
      <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0">
        <HeadPage
          label={"Leave Approval"}
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

          {/* <div
            className="flex flex-1 flex-col md:flex-wrap md:flex-row items-center justify-evenly
           min-h-0 overflow-auto space-y-1 pb-4 gap-8 p-2"
          > */}
          <div className="flex-1 min-h-0 overflow-auto space-y-2 pb-4">
            {request.length === 0 && !loading && (
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
              : request.map((item, index) => (
                  <div
                    key={index}
                    className={`flex px-1 py-2 md:p-2 mx-2 rounded-2xl items-center min-h-0 bg-red-100`}
                  >
                    <TableChild>
                      <div className="flex items-center justify-center w-full md:gap-1 max-w-25 xl:max-w-40 xl:gap-2">
                        {item.new_tgl2 && item.revision_status === 0 && (
                          <div
                            onClick={() => handleClickDetail(item)}
                            className="flex items-center gap-1 p-0.5 md:px-1 bg-amber-100 rounded-full outline-1 outline-amber-500 text-amber-900 cursor-pointer"
                          >
                            <PenLine size={"12px"} title="Revision Pending" />
                            <span className="hidden md:flex">Revision</span>
                          </div>
                        )}
                        <CheckBox
                          id={"Chck"}
                          label={item.namalengkap}
                          truncateSize={"5"}
                          truncateDot={false}
                          status={item.fl_approve}
                          checked={checkedIds.includes(item.id)}
                          onClick={() =>
                            handleToggleCheck(item.id, item.fl_approve)
                          }
                        />
                      </div>
                    </TableChild>
                    <TableChild>{item?.leaveName}</TableChild>
                    <TableChild flexSize="flex-2">
                      {formatDateRangeIndo(item?.tgl1, item?.tgl2)}
                    </TableChild>
                    <TableChild flexSize="flex-[0.2]">
                      <div
                        className={`ignore-popup-close flex items-center rounded-full hover:bg-red-300 cursor-pointer leading-none p-1 xl:p-1 transition-all duration-200 select-none ${
                          rowPopup?.index === index ? "bg-red-300" : ""
                        }`}
                        onClick={(e) => handleClickMoreRow(e, index, item)}
                      >
                        <EllipsisVertical className="size-5" />
                      </div>
                    </TableChild>
                  </div>
                ))}

            {/* {loading
              ? skeletonLoop.map((m, index) => (
                  <Card key={index}>
                    <div className="text-transparent">
                      <div className="flex justify-between mb-3">
                        <h3 className="font-medium text-lg bg-slate-200 skeleton rounded-2xl px-2">
                          Loading
                        </h3>
                        <div
                          className={`px-2 py-0.5 mt-1 rounded-full text-sm h-fit skeleton bg-slate-200`}
                        >
                          Loading
                        </div>
                      </div>
                      <div className="flex flex-col rounded-xl p-2 gap-2 mb-5 text-sm">
                        <p className="skeleton w-fit font-medium rounded-2xl bg-slate-200 ">
                          Request:
                        </p>
                        <p className="skeleton text-lg font-medium bg-slate-200 rounded-2xl">
                          Loading - Loading Day(s)
                        </p>
                        <div className="flex gap-3 w-full my-2 lg:mb-1.5">
                          <div className="skeleton flex flex-1 flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm">
                            <p className="text-xs">From</p>
                            <p className="font-medium text-sm lg:text-base">
                              Loading
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className="material-symbols-outlined">
                              arrow_forward
                            </span>
                          </div>
                          <div className="skeleton flex flex-1 flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm ">
                            <p className="text-xs">To</p>
                            <p className="font-medium text-sm lg:text-base">
                              Loading
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex mb-2">
                        <Button
                          btnLabel={"View Details"}
                          btnColor="skeleton outline-none bg-slate-200"
                          textSize="text-sm shadow-sm!"
                        />
                      </div>
                    </div>
                  </Card>
                ))
              : request.map((item) => (
                  <Card key={item.id}>
                    {item.new_tgl2 && (
                      <div className="flex w-full justify-between items-center outline-1 px-2 py-1 mb-2 rounded-full outline-slate-400 shadow-sm">
                        <p className="font-medium">Revision</p>
                        <div
                          className={`px-2 py-0.5 my-0.5 rounded-full outline-1 text-sm h-fit ${
                            approvalStatusConfig[item?.revision_status]
                              ?.badgeClass ?? ""
                          }`}
                        >
                          {approvalStatusConfig[item?.revision_status]?.label ??
                            ""}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between mb-3">
                      <h3 className="font-medium text-lg">
                        {item?.namalengkap}
                      </h3>
                      <div
                        className={`px-2 py-0.5 mt-1 rounded-full outline-1 text-sm h-fit ${
                          approvalStatusConfig[item?.fl_approve]?.badgeClass ??
                          ""
                        }`}
                      >
                        {approvalStatusConfig[item?.fl_approve]?.label ?? ""}
                      </div>
                    </div>
                    <div className="flex flex-col rounded-xl p-2 gap-2 mb-5 text-sm">
                      <p className="font-medium text-slate-600">Request:</p>
                      <p className="text-lg text-center font-medium">
                        {item?.leaveName} - {item?.duration} Day(s)
                      </p>
                      <div className="flex gap-3 w-full my-2 lg:mb-1.5">
                        <div className="flex flex-1 flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm">
                          <p className="text-xs">From</p>
                          <p className="font-medium text-base   ">
                            {formatDateIndo(item?.tgl1)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="material-symbols-outlined">
                            arrow_forward
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm ">
                          <p className="text-xs">To</p>
                          <p className="font-medium text-base">
                            {formatDateIndo(item?.tgl2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex mb-2">
                      <Button
                        btnLabel={"View Details"}
                        btnColor=" outline-1 outline-slate-300 hover:outline-slate-500 hover:text-black/60!"
                        textSize="text-base shadow-sm!"
                        handleClick={() => {
                          fetchLeaveQuota(item.regnum, item.tgl1);
                          openModal();
                          setSelectedRequest(item);
                          setRejectNotes(
                            item.rejection_notes ||
                              item.revision_rejection_notes ||
                              "",
                          );
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
                mode === "form"
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <ModalPanel
                title={selectedRequest?.namalengkap}
                titlePosition="text-left"
                subtitle={`${selectedRequest?.jabatan} - ${selectedRequest?.divisi}`}
                handleClose={handleClose}
                badgeColor={statusConfig?.badgeClass ?? ""}
                badgeLabel={statusConfig?.label ?? ""}
              >
                <FormContent>
                  <div className="flex gap-3 w-full mb-1 lg:mb-1.5">
                    <div className="flex flex-1 flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm">
                      <p className="text-xs">From</p>
                      <p className="font-medium text-sm lg:text-base">
                        <span className="md:hidden">
                          {formatDateIndo(selectedRequest?.tgl1, "short")}
                        </span>
                        <span className="hidden md:inline">
                          {formatDateIndo(selectedRequest?.tgl1, "long")}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span>
                        <ArrowRight />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm ">
                      <p className="text-xs">To</p>
                      <p className="font-medium text-sm lg:text-base">
                        <span className="md:hidden">
                          {formatDateIndo(selectedRequest?.tgl2, "short")}
                        </span>
                        <span className="hidden md:inline">
                          {formatDateIndo(selectedRequest?.tgl2, "long")}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-sm mb-1">
                    <p>Total Duration</p>
                    <p className="font-medium">
                      {selectedRequest?.duration} Day(s)
                    </p>
                  </div>
                  <div className="flex justify-between w-full text-sm mb-4">
                    <p>Current Leave Quota</p>
                    <div className="flex items-center gap-1">
                      <span
                        className={`rounded-full p-0.5 leading-none transition duration-300 ease-in-out ${popupOpen ? "bg-slate-300" : ""} select-none cursor-pointer hover:text-black/50 transition duration-300 ease-in-out`}
                        onClick={handleCutiDetail}
                      >
                        <Info className="size-4" />
                      </span>
                      <p className="font-medium">{leaveQuota} Day(s)</p>
                    </div>
                  </div>
                  <div className="flex flex-1 w-full text-lg text-slate-800 font-medium mb-1">
                    <p>{selectedRequest?.leaveName}</p>
                  </div>
                  <div className="flex flex-col gap-2 mb-2 outline-1 outline-slate-400 rounded-xl shadow-md text-sm w-full p-2">
                    <div className="flex justify-between gap-10">
                      <p>Desc</p>
                      <p className="text-right">
                        {selectedRequest?.keterangan}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p>Req. Date</p>
                      <p className="text-right">
                        {formatDateIndo(selectedRequest?.log_date)}
                      </p>
                    </div>
                    {selectedRequest?.leave_id === 1 &&
                      selectedRequest?.medical_certificate_name && (
                        <div className="flex justify-between">
                          <p>Medical Certificate</p>
                          {selectedRequest?.medical_certificate_mime?.startsWith(
                            "image/",
                          ) ? (
                            <div
                              className="flex gap-1 group"
                              onClick={() => setOpenPreview(true)}
                              title="Preview File"
                            >
                              {previewFileLoader.loading ? (
                                <BtnLoading />
                              ) : (
                                <img
                                  src={previewFiles}
                                  className="h-6 rounded object-cover cursor-zoom-in select-none hover:opacity-80 transition group-hover:opacity-80"
                                />
                              )}
                              <span className="cursor-pointer group-hover:underline shrink-0">
                                {truncateText(
                                  selectedRequest?.medical_certificate_original_name,
                                  20,
                                )}
                              </span>
                            </div>
                          ) : (
                            <div
                              className="flex gap-1 group"
                              onClick={() => setOpenPreview(true)}
                              title="Preview File"
                            >
                              {previewFileLoader.loading ? (
                                <BtnLoading />
                              ) : (
                                <File
                                  className="size-4.5 hover:opacity-80 group-hover:opacity-80 cursor-pointer"
                                  strokeWidth={"1.5px"}
                                />
                              )}
                              <span className="cursor-pointer group-hover:underline shrink-0">
                                {truncateText(
                                  selectedRequest?.medical_certificate_original_name,
                                  20,
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                  {selectedRequest?.new_tgl2 && (
                    <div className="flex flex-col flex-1 w-full mt-2">
                      <div className="flex flex-1 w-full justify-between text-slate-800 mb-3">
                        <p className="font-medium text-base">Revision</p>
                        <div
                          className={`px-1.5 py-0.5 mt-0.5 rounded-full outline-1 text-sm h-fit ${
                            approvalStatusConfig[
                              selectedRequest?.revision_status
                            ]?.badgeClass ?? ""
                          }`}
                        >
                          {approvalStatusConfig[
                            selectedRequest?.revision_status
                          ]?.label ?? ""}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mb-2 outline-1 outline-slate-400 rounded-xl shadow-md text-sm w-full p-2">
                        <div className="flex justify-between">
                          <p>Date Change</p>
                          <p className="text-right">
                            {formatDateIndo(selectedRequest?.old_tgl2)}
                            {" → "}
                            {formatDateIndo(selectedRequest?.new_tgl2)}
                          </p>
                        </div>
                        <div className="flex justify-between gap-10">
                          <p>Reason</p>
                          <p className="text-right">
                            {selectedRequest?.revision_reason}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <p>Req. Date</p>
                          <p className="text-right">
                            {formatDateIndo(selectedRequest?.revision_log_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* <div
                    className={`w-full space-y-5 mt-5 transition-all duration-500 ease-in-out
                                ${
                                  actionMode === "reject" ||
                                  selectedRequest?.fl_approve == 2 ||
                                  selectedRequest?.revision_status == 2
                                    ? "opacity-100 translate-y-0 max-h-60 pointer-events-auto"
                                    : "opacity-0 -translate-y-8 max-h-0 pointer-events-none"
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
                        btnColor="bg-slate-300 hover:bg-slate-400 outline-1 outline-slate-600 disabled:text-black/40"
                        btnWidth=""
                        btndisable={submitLoader.loading}
                      />
                      <Button
                        btnLabel={
                          submitLoader.loading ? (
                            <div className="px-4 py-0.5">
                              <BtnLoading />
                            </div>
                          ) : (
                            <div>
                              <p>Reject</p>
                            </div>
                          )
                        }
                        btndisable={submitLoader.loading}
                        handleClick={handleReject}
                        btnColor="bg-red-300 hover:bg-red-400 outline-1 outline-red-600"
                        btnWidth=""
                      />
                    </div>
                  )} */}
                  <ActionFormSection
                    actionMode={actionMode}
                    appear={
                      actionMode === "reject" ||
                      actionMode === "revoke" ||
                      selectedRequest?.fl_approve == 2 ||
                      selectedRequest?.fl_approve == 4 ||
                      selectedRequest?.revision_status == 2
                    }
                    btnLabel={actionMode}
                    handleCancel={() => setActionMode(null)}
                    handleClick={
                      actionMode === "reject" ? handleReject : handleRevoke
                    }
                    loading={submitLoader.loading}
                    noteIsDisable={!!selectedRequest?.rejection_notes}
                    notesLabel={
                      actionMode ? `${actionMode} Notes` : "Reject Notes"
                    }
                    notesValue={rejectNotes}
                    setNotesValue={setRejectNotes}
                  />

                  {actionMode != "reject" &&
                    (selectedRequest?.fl_approve == 0 ||
                      (selectedRequest?.revision_status === 0 &&
                        selectedRequest?.new_tgl2)) && (
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
                          handleClick={handleSubmit}
                        />
                      </div>
                    )}

                  {actionMode === null &&
                    selectedRequest?.fl_approve === 1 &&
                    (selectedRequest?.revision_status === null ||
                      selectedRequest?.revision_status === 1) && (
                      <div className="flex gap-6 lg:gap-9 mt-5">
                        <Button
                          btnLabel={
                            pdfLoader.loading ? (
                              <BtnLoading label={"Downloading"} />
                            ) : (
                              <div>Download PDF</div>
                            )
                          }
                          btnWidth="w-35 px-1!"
                          btnColor="outline-1 outline-slate-400 hover:outline-slate-600 hover:text-black/60!"
                          textSize="text-sm shadow-sm!"
                          handleClick={handleGeneratePDF}
                          btndisable={pdfLoader.loading}
                        />
                        <Button
                          btnLabel={
                            submitLoader.loading ? (
                              <BtnLoading label={"Processing"} />
                            ) : (
                              <div className="my-0.5">Revoke Approval</div>
                            )
                          }
                          btnWidth="w-35 px-1!"
                          btnColor="outline-1 outline-slate-400 hover:outline-slate-600 hover:text-black/60! disabled:text-black/40"
                          textSize="text-sm shadow-sm!"
                          handleClick={() => setActionMode("revoke")}
                          btndisable={pdfLoader.loading}
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
              <ModalPanel title={getSuccessModalTitle()} handleClose={close}>
                <FormSuccess />
                <Button handleClick={close} btnLabel={"OK"} />
              </ModalPanel>
            </div>
          )}
        </Modal>

        {popup && (
          <PopUpMenu
            position={popup.rect}
            open={popupOpen}
            onClose={handleClosePopup}
            popupWidth="w-50 lg:w-60"
            zIndex="z-50"
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

        {rowPopup && (
          <PopUpMenu
            position={rowPopup.rect}
            open={rowPopupOpen}
            onClose={handleCloseRowPopup}
          >
            <SidebarButton
              name={"Detail"}
              handleClick={() => handleClickDetail(rowPopup.item)}
            />
          </PopUpMenu>
        )}

        <AttachmentPreview
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          file={{
            url: previewFiles,
            mime: selectedRequest?.medical_certificate_mime,
            originName: selectedRequest?.medical_certificate_original_name,
          }}
          loading={previewFileLoader.loading}
        />
      </div>
    </>
  );
}
