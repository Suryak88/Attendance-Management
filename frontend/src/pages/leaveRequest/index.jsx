import {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import FloatingDate from "../../components/atoms/FloatingDate";
import FloatingSelect from "../../components/atoms/FloatingSelect";
import { useLeaveTypeStore } from "../../store/useLeaveTypeStore";
import { AuthContext } from "../../context/AuthContext";
import FloatingTextArea from "../../components/atoms/FloatingTextArea";
import api from "../../utils/axiosInstance";
import { useModal } from "../../hooks/useModal";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FormSuccess from "../../components/organisms/Modal/contents/FormSuccess";
import Button from "../../components/atoms/Button";
import {
  formatLocalDate,
  formatDateFromPicker,
  formatDateIndo,
  countWorkingDays,
} from "../../utils/Date";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { useLocation } from "react-router-dom";
import { approvalStatusConfig } from "../../utils/statusColor";
import FormDelete from "../../components/organisms/Modal/contents/FormDelete";
import { toast } from "sonner";
import PopUpMenu from "../../components/organisms/PopUpMenu";
import TableChild from "../../components/atoms/TableChild";
import { useHoliday } from "../../context/HolidayContext";
import { truncateText } from "../../utils/truncateText";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import HistoryBar from "../../components/organisms/HistoryBar";
import BtnLoading from "../../components/atoms/BtnLoading";
import { extractErrorMessage } from "../../utils/extractErrorBlob";
import { ArrowRight, File, Info, X } from "lucide-react";
import FloatingUpload from "../../components/atoms/FloatingUpload";
import { FloatingPortal } from "@floating-ui/react";
import AttachmentPreview from "../../components/organisms/AttachmentPreview";

export default function LeaveRequest() {
  const { state } = useLocation();
  const [startDisplay, setStartDisplay] = useState("");
  const [endDisplay, setEndDisplay] = useState("");
  const [form, setForm] = useState({
    startDate: null,
    endDate: null,
    leaveTypeId: null,
    medicalCertificate: null,
    desc: "",
  });
  const { user } = useContext(AuthContext);
  const [formKey, setFormKey] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [leaveQuota, setLeaveQuota] = useState(0);
  const [reqHistory, setReqHistory] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [popup, setPopup] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [cutiDetail, setCutiDetail] = useState([]);
  const [actionMode, setActionMode] = useState(null);
  const [revisedDate, setRevisedDate] = useState(null);
  const [revisedDisplay, setRevisedDisplay] = useState("");
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [openHistory, setOpenHistory] = useState(false);
  const [endLeaveEarlyNotes, setEndLeaveEarlyNotes] = useState("");
  const { holidaySet, loading: holidayLoading } = useHoliday();
  const statusConfig = approvalStatusConfig[selectedReq?.fl_approve];

  const resetForm = useCallback(() => {
    setTimeout(() => {
      setForm({
        startDate: null,
        endDate: null,
        leaveTypeId: null,
        desc: "",
      });
      setStartDisplay("");
      setEndDisplay("");
    }, 300);
    setFormKey((k) => k + 1);
  }, []);

  const resetModal = useCallback(() => {
    setSelectedReq(null);
    setActionMode(null);
    setRevisedDate(null);
    setRevisedDisplay("");
    setEndLeaveEarlyNotes("");
    setOpenHistory(false);
    if (previewFiles) {
      URL.revokeObjectURL(previewFiles);
    }
    setPreviewFiles(null);
  });

  const handleClear = () => {
    setForm((prev) => ({
      ...prev,
      startDate: null,
      endDate: null,
    }));
    setStartDisplay("");
    setEndDisplay("");
    setCalendarMonth(new Date());
  };

  const modal = useModal(resetModal);
  const {
    showSuccess,
    open,
    openModal,
    close,
    mode,
    deleteModal,
    openWithMode,
  } = modal;

  const isEndDateInvalid =
    form.startDate && form.endDate && form.endDate < form.startDate;

  const leaveTypes = useLeaveTypeStore((s) => s.leaveTypes);
  const leaveTypeOptions = leaveTypes.map((lt) => ({
    label: lt.nama,
    value: lt.id,
  }));
  const fetchLeaveTypes = useLeaveTypeStore((s) => s.fetchLeaveTypes);
  const loaded = useLeaveTypeStore((s) => s.loaded);
  const historyLoader = useDelayedLoading();
  const quotaLoader = useDelayedLoading();
  const pdfLoader = useDelayedLoading();
  const submitLoader = useDelayedLoading();
  const previewFileLoader = useDelayedLoading();
  const skeletonLoop = Array.from({ length: 3 });
  const [previewImage, setPreviewImage] = useState(null);
  const [previewFiles, setPreviewFiles] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    if (!state) return;
    const date = new Date(state.date);
    setField("startDate", date);
    setField("endDate", date);
    setStartDisplay(formatDateFromPicker(date));
    setEndDisplay(formatDateFromPicker(date));
  }, [state]);

  useEffect(() => {
    if (form.startDate) {
      setCalendarMonth(
        new Date(form.startDate.getFullYear(), form.startDate.getMonth(), 1),
      );
    }
  }, [form.startDate]);

  useEffect(() => {
    if (!user || loaded) return;
    fetchLeaveTypes();
  }, [user, loaded]);

  useEffect(() => {
    if (!user) return;
    fetchLeaveQuota();
    if (!holidayLoading) {
      fetchLeaveHistory();
    }
  }, [user, holidayLoading]);

  async function fetchLeaveQuota() {
    const now = new Date(); //SEMENTARA SAMPAI CUTI JAN - MAR SELESAI DIINPUT

    quotaLoader.startLoading();
    await api
      // .get("/leaveRequest/quota") //KEMBALIKAN KE SINI SETELAH CUTI SELESAI INPUT
      .get("/leaveRequest/quota", {
        params: {
          date: formatLocalDate(new Date(now.getFullYear(), 2, 1)),
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
      .catch((error) => console.error(error))
      .finally(quotaLoader.stopLoading);
  }

  async function fetchLeaveHistory() {
    historyLoader.startLoading();
    await api
      .get("/leaveRequest/")
      .then((res) => {
        const formatted = formatting(res.data, holidaySet);
        setReqHistory(formatted);
      })
      .catch((error) => console.error(error))
      .finally(historyLoader.stopLoading);
  }

  function formatting(logs, holidaySet) {
    return logs.map((l) => {
      const rangeStartDate = new Date(l.tgl2);
      const today = new Date();
      rangeStartDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const selisihWaktu = (today - rangeStartDate) / (1000 * 60 * 60 * 24);
      const duration = countWorkingDays(l.tgl1, l.tgl2, holidaySet);

      return {
        ...l,
        selisihWaktu,
        duration,
      };
    });
  }

  function setField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error("Enter valid date!");
      return;
    }
    if (isEndDateInvalid) {
      toast.error("End date is invalid!");
      return;
    }
    if (!form.leaveTypeId) {
      toast.error("Please select leave type!");
      return;
    }
    if (form.leaveTypeId === 1 && !form.medicalCertificate) {
      toast.error("Please upload medical certificate!");
      return;
    }
    if (!form.desc || form.desc.trim() === "") {
      toast.error("Please enter the description!");
      return;
    }

    const formData = new FormData();
    formData.append("name", user.fullname);
    formData.append("startDate", formatLocalDate(form.startDate));
    formData.append("endDate", formatLocalDate(form.endDate));
    formData.append("leaveType", form.leaveTypeId);
    formData.append("description", form.desc);
    if (form.leaveTypeId === 1 && form.medicalCertificate) {
      formData.append("medicalCertificate", form.medicalCertificate);
    }
    try {
      submitLoader.startLoading();
      await api.post("/leaveRequest/", formData);
      resetForm();
      fetchLeaveHistory();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function handleCancel(e) {
    e.preventDefault();

    try {
      await api.put(`/leaveRequest/cancel/${selectedReq.id}`);
      fetchLeaveHistory();
      showSuccess();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Gagal membatalkan request",
      );
    }
  }

  const totalDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    if (isEndDateInvalid) return 0;
    return countWorkingDays(form.startDate, form.endDate, holidaySet);
  }, [form.startDate, form.endDate, isEndDateInvalid]);

  const range = useMemo(() => {
    if (!form.startDate && !form.endDate) return undefined;

    return {
      from: form.startDate,
      to: form.endDate,
    };
  }, [form.startDate, form.endDate]);

  function handleCutiDetail(e, index, item) {
    e.stopPropagation();

    // if (popupOpen) {
    //   handleClosePopup();
    //   return;
    // }

    // toggle behavior
    if (popup && popup.index === index) {
      // setPopup(null);
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

  async function submitRevise(e) {
    e.preventDefault();
    if (!revisedDate) {
      toast.error("Please select the last day of leave");
      return;
    }
    if (!endLeaveEarlyNotes || endLeaveEarlyNotes.trim() === "") {
      toast.error("Please provide a reason for ending the leave early");
      return;
    }
    try {
      await api.put(`/leaveRequest/revise/${selectedReq.id}`, {
        toDate: formatLocalDate(revisedDate),
        reason: endLeaveEarlyNotes,
      });
      await fetchLeaveHistory();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit");
    }
  }

  function showButtonEndEarly(selectedReq) {
    return (
      selectedReq?.fl_approve === 1 &&
      selectedReq?.selisihWaktu < 90 &&
      selectedReq?.duration > 1 &&
      actionMode !== "endLeaveEarly" &&
      selectedReq?.revision_status !== 1
    );
  }

  async function showRevisionHistory(id) {
    try {
      await api.get(`/leaveRequest/revision/history/${id}`).then((res) => {
        setRevisionHistory(res.data);
      });
    } catch (error) {
      console.error(error);
    }
  }

  function showHistorySection() {
    return openHistory && revisionHistory.length > 0;
  }

  async function handleGeneratePDF() {
    const fileName = `${selectedReq?.leavename} - ${selectedReq?.fullname}.pdf`;

    try {
      pdfLoader.startLoading();

      const res = await api.post(
        `/leaveRequest/generatePDF/${selectedReq?.id}`,
        {},
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
      <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0 overflow-auto scrollbar-hidden">
        <div className="p-3 font-normal">
          <h3 className="text-xl md:text-2xl font-medium">Leave Request</h3>
        </div>
        <div
          className={`flex flex-col bg-slate-100 mx-4 my-5 px-3 pt-3 pb-2 rounded-xl border  border-slate-400 shadow-sm  
            md:max-w-2xl md:flex-row md:mx-auto
            lg:mx-4
            xl:max-w-3xl`}
          key={formKey}
        >
          <div className="flex md:pr-5">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex justify-between mb-8 items-start">
                <h3 className="font-medium text-lg md:text-xl text-left">
                  Leave Request Form
                </h3>
                <div className="flex gap-1 items-center md:hidden">
                  {quotaLoader.loading ? (
                    <h3 className="font-normal text-xs skeleton text-transparent rounded-2xl bg-slate-200">
                      00 leaves remaining
                    </h3>
                  ) : (
                    <h3 className="font-normal text-xs ">
                      {leaveQuota} leaves remaining
                    </h3>
                  )}
                  <span
                    className={`rounded-full p-0.5 leading-none transition duration-300 ease-in-out ${popupOpen ? "bg-slate-300" : ""}`}
                    onClick={handleCutiDetail}
                  >
                    <Info className="size-4" />
                  </span>
                </div>
              </div>
              <div className="flex gap-3 -mb-2">
                <div className="flex flex-col flex-1 items-end">
                  <FloatingDate
                    id="strDate"
                    label="Start Date"
                    message="Please enter valid date"
                    selectedDate={form.startDate}
                    setSelectedDate={(v) => setField("startDate", v)}
                    displayValue={startDisplay}
                    setDisplayValue={setStartDisplay}
                    border="border"
                    fontThickness="font-normal"
                  />
                </div>
                <div className="flex flex-col flex-1 items-start">
                  <FloatingDate
                    id="endDate"
                    label="End Date"
                    message={
                      isEndDateInvalid
                        ? "End date can't be earlier than start date"
                        : "Please enter valid date"
                    }
                    selectedDate={form.endDate}
                    setSelectedDate={(v) => setField("endDate", v)}
                    displayValue={endDisplay}
                    setDisplayValue={setEndDisplay}
                    isExternalError={isEndDateInvalid}
                    border="border"
                    fontThickness="font-normal"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center mb-2">
                {/* <div className="flex flex-col w-full items-center"> */}
                <FloatingSelect
                  id="leaveType"
                  label="Leave type"
                  options={leaveTypeOptions}
                  value={form.leaveTypeId}
                  onValueChange={(v) => setField("leaveTypeId", v)}
                  message={"Please select leave type"}
                  border="border"
                  fontThickness="font-normal"
                />
                {/* </div> */}
              </div>
              <div
                className={`flex flex-col items-center  transition-all duration-300 ${form.leaveTypeId === 1 ? "opacity-100 pointer-events-auto mb-3 -translate-y-1" : "max-h-0 opacity-0 pointer-events-none translate-y-1"}`}
              >
                <FloatingUpload
                  id={"sakitDokumentasi"}
                  label={"Medical Certificate"}
                  accept=".jpg,.jpeg,.png,.pdf"
                  // message={"Upload your medical certified here"}
                  value={form.medicalCertificate}
                  onValueChange={(file) => setField("medicalCertificate", file)}
                  onPreview={setPreviewImage}
                  openWithMode={openWithMode}
                />
              </div>
              <div className="flex flex-col items-center">
                {/* <div className="flex flex-col w-full items-center h-fit"> */}
                <FloatingTextArea
                  id="description"
                  value={form.desc}
                  onValueChange={(v) => setField("desc", v)}
                  message={"Please enter the description"}
                  border="border"
                  labelFontThickness="font-normal"
                />
                {/* </div> */}
              </div>
              <div className="flex flex-col justify-center items-center mt-6 mb-3">
                <Button
                  handleClick={handleSubmit}
                  btndisable={submitLoader.loading}
                  btnLabel={
                    submitLoader.loading ? (
                      <div className="my-1.5">
                        <BtnLoading />
                      </div>
                    ) : (
                      <div>Submit</div>
                    )
                  }
                />
              </div>
              <p className="text-xs md:hidden">Total leave days: {totalDays}</p>
            </form>
          </div>
          <div className="hidden md:flex flex-col">
            <div className="flex justify-end gap-1 items-center mb-5">
              {quotaLoader.loading ? (
                <h3 className="font-normal text-sm text-right bg-slate-200 rounded-2xl skeleton text-transparent">
                  {leaveQuota} leaves remaining
                </h3>
              ) : (
                <h3 className="font-normal text-sm text-right ">
                  {leaveQuota} leaves remaining
                </h3>
              )}

              <span
                className={`rounded-full p-1 leading-none cursor-pointer hover:text-black/50 transition duration-300 ease-in-out ${popupOpen ? "bg-slate-300" : ""}`}
                onClick={handleCutiDetail}
              >
                <Info className="size-4.5" />
              </span>
            </div>
            <div className="h-80">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={(r) => {
                  if (!r) {
                    setField("startDate", null);
                    setField("endDate", null);
                    setStartDisplay("");
                    setEndDisplay("");
                    return;
                  }

                  setField("startDate", r.from ?? null);
                  setField("endDate", r.to ?? null);

                  setStartDisplay(r.from ? formatDateFromPicker(r.from) : "");
                  setEndDisplay(r.to ? formatDateFromPicker(r.to) : "");
                }}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                navLayout="around"
                animate
                className="p-1 flex grow"
                style={{
                  "--rdp-accent-color": "#000000",
                  "--rdp-accent-background-color": "#fee2e2",
                  "--rdp-range_start-date-background-color": "#f87171",
                  "--rdp-range_end-date-background-color": "#f87171",
                  "--rdp-range_middle-background-color": "#fee2e2",
                }}
                classNames={{
                  day: "m-1 hover:bg-red-400 hover:text-white rounded-full",
                  today: `${getDefaultClassNames} outline outline-red-400 rounded-full`,
                  selected:
                    "font-normal hover:rounded-none focus:ring-0 outline-none rounded-none",
                }}
                modifiers={{
                  sunday: (date) => date.getDay() === 0,
                  holiday: (date) => holidaySet.has(formatLocalDate(date)),
                }}
                modifiersClassNames={{
                  sunday: "text-red-600",
                  holiday: "text-red-600",
                }}
              />
            </div>
            <div className="flex justify-end items-center gap-3 mb-3">
              <p className="text-xs relative">Total leave days: {totalDays}</p>
              <button
                className="shadow-sm bg-slate-300 rounded-full z-20 w-fit px-3 hover:bg-slate-400 hover:text-white cursor-pointer outline outline-slate-400"
                onClick={handleClear}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <HistoryBar>
          <div className="flex flex-1 gap-5 items-center ">
            {reqHistory.length < 1 && !historyLoader.loading && (
              <div className="text-sm text-center">
                <p>No data</p>
              </div>
            )}
            {historyLoader.loading
              ? skeletonLoop.map((m, index) => (
                  <div
                    key={index}
                    className="flex flex-col w-55 lg:w-65 h-fit rounded-xl p-2 outline outline-slate-400 shadow-sm text-transparent"
                  >
                    <div className="flex py-1 justify-between items-center">
                      <div className="bg-slate-200 skeleton rounded-2xl px-2">
                        Loading
                      </div>
                      <div className="flex items-center justify-end skeleton">
                        <div
                          className={`skeleton rounded-full text-xs h-fit bg-slate-200`}
                        >
                          Loading
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 my-2 lg:mb-1.5 ">
                      <div className="flex w-full justify-between">
                        <div className="skeleton flex flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm">
                          <p className="text-xs">From</p>
                          <p className="font-medium text-[13px] text-center lg:text-base">
                            00/00/0000
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span>
                            <ArrowRight className="size-4.5" />
                          </span>
                        </div>
                        <div className="skeleton flex flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm ">
                          <p className="text-xs">To</p>
                          <p className="font-medium text-[13px] text-center lg:text-base">
                            00/00/0000
                          </p>
                        </div>
                      </div>
                      <div className="flex mt-2 justify-between text-xs">
                        <p className="w-full skeleton rounded-2xl bg-slate-200">
                          Desc
                        </p>
                      </div>
                      <div className="flex justify-between text-xs">
                        <p className="w-full skeleton rounded-2xl bg-slate-200">
                          Loading
                        </p>
                      </div>
                    </div>
                    <div className={`flex justify-center mt-2 gap-2`}>
                      <Button
                        btnLabel="Details"
                        btnWidth=""
                        btnColor="skeleton bg-slate-200 outline-none"
                        textSize="text-xs shadow-sm!"
                      />
                    </div>
                  </div>
                ))
              : reqHistory.map((item, index) => (
                  <div
                    className="flex flex-col w-55 lg:w-65 h-fit rounded-xl p-2 outline outline-slate-400 shadow-sm"
                    key={index}
                  >
                    <div className="flex py-1 justify-between items-center">
                      <div>{item?.leavename}</div>
                      <div className="flex items-center justify-end">
                        <div
                          className={`px-1.5 py-0.5 mt-1 rounded-full outline-1 text-xs h-fit ${
                            approvalStatusConfig[item?.fl_approve]
                              ?.badgeClass ?? ""
                          }`}
                        >
                          {approvalStatusConfig[item?.fl_approve]?.label ?? ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 my-2 lg:mb-1.5 ">
                      <div className="flex w-full justify-between">
                        <div className="flex flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm">
                          <p className="text-xs">From</p>
                          <p className="font-medium text-[13px] text-center lg:text-base">
                            {formatDateIndo(item?.tgl1)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span>
                            <ArrowRight className="size-4.5" />
                          </span>
                        </div>
                        <div className="flex flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm ">
                          <p className="text-xs">To</p>
                          <p className="font-medium text-[13px] text-center lg:text-base">
                            {formatDateIndo(item?.tgl2)}
                          </p>
                        </div>
                      </div>
                      {item?.new_tgl2 && (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <p className="font-medium">
                              Revise to {formatDateIndo(item?.new_tgl2)}
                            </p>
                            <div
                              className={`px-1 mt-0.5 rounded-full outline-1 text-xs h-fit ${
                                approvalStatusConfig[item?.revision_status]
                                  ?.badgeClass ?? ""
                              }`}
                            >
                              {approvalStatusConfig[item?.revision_status]
                                ?.label ?? ""}
                            </div>
                          </div>
                          <hr className="text-slate-300 shadow-sm my-0.5" />
                        </>
                      )}
                      <div className="flex justify-between text-xs">
                        <p>Desc</p>
                        <p className="text-right">
                          {truncateText(item?.keterangan, 16)}
                        </p>
                      </div>
                      <div className="flex justify-between text-xs">
                        <p>Req. Date</p>
                        <p className="">{formatDateIndo(item?.log_date)}</p>
                      </div>
                    </div>
                    <div className={`flex justify-center mt-2 gap-2`}>
                      <Button
                        btnLabel="Details"
                        btnWidth=""
                        btnColor="outline-1 outline-slate-400 hover:outline-slate-600 hover:text-black/60!"
                        textSize="text-xs shadow-sm!"
                        handleClick={() => {
                          openModal();
                          setSelectedReq(item);
                          showRevisionHistory(item.id);
                          getMedicalCertificate(item);
                        }}
                      />
                      {item.fl_approve === 0 && (
                        <Button
                          btnLabel="Cancel"
                          btnWidth=""
                          btnColor="outline-1 outline-slate-400 hover:outline-slate-600 hover:text-black/60!"
                          textSize="text-xs shadow-sm!"
                          handleClick={() => {
                            deleteModal();
                            setSelectedReq(item);
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </HistoryBar>

        <Modal
          openModal={open}
          onClose={close}
          contentWidth={
            mode === "form" ? "w-13/16 lg:w-[420px]" : "w-3/4 lg:w-fit"
          }
        >
          {mode === "success" && (
            <ModalPanel
              title={`${selectedReq ? "Request Sent!" : "Form Sent!"}`}
              handleClose={close}
            >
              <FormSuccess />
              <Button handleClick={close} btnLabel={"OK"} />
            </ModalPanel>
          )}
          {mode === "confirm" && (
            <ModalPanel title={"Cancel request? "} handleClose={close}>
              <div className="flex w-full flex-col text-sm outline outline-slate-400 rounded-xl p-2 gap-2">
                <p className="text-base font-medium">
                  {selectedReq?.leavename}
                </p>
                <div className="flex w-full justify-evenly">
                  <div className="flex flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm">
                    <p className="text-xs">From</p>
                    <p className="md:hidden font-medium text-sm text-center">
                      {formatDateIndo(selectedReq?.tgl1)}
                    </p>
                    <p className="hidden md:flex font-medium text-center text-base">
                      {formatDateIndo(selectedReq?.tgl1, "short")}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span>
                      <ArrowRight className="size-5" />
                    </span>
                  </div>
                  <div className="flex flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm ">
                    <p className="text-xs">To</p>
                    <p className="md:hidden font-medium text-sm text-center ">
                      {formatDateIndo(selectedReq?.tgl2)}
                    </p>
                    <p className="hidden md:flex font-medium text-center text-base">
                      {formatDateIndo(selectedReq?.tgl2, "short")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 justify-between">
                  <p>Req. Date </p>
                  <p>{formatDateIndo(selectedReq?.log_date)}</p>
                </div>
              </div>
              <FormDelete onClose={close} onSubmit={handleCancel} />
            </ModalPanel>
          )}
          {mode === "form" && (
            <ModalPanel
              title={selectedReq?.leavename}
              titlePosition="left"
              handleClose={close}
              badgeColor={statusConfig?.badgeClass ?? ""}
              badgeLabel={statusConfig?.label ?? ""}
            >
              <div className="flex w-full justify-between gap-1 md:gap-3">
                <div className="flex flex-1 flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm">
                  <p className="text-xs">From</p>
                  <p className="font-medium text-sm lg:text-base">
                    <span className="md:hidden">
                      {formatDateIndo(selectedReq?.tgl1, "short")}
                    </span>
                    <span className="hidden md:inline">
                      {formatDateIndo(selectedReq?.tgl1, "long")}
                    </span>
                  </p>
                </div>
                <div className="flex items-center">
                  <span>
                    <ArrowRight className="size-5 md:size-6" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col rounded-xl bg-slate-200 p-2 outline-1 outline-slate-300 shadow-sm ">
                  <p className="text-xs">To</p>
                  <p className="font-medium text-sm lg:text-base">
                    <span className="md:hidden">
                      {formatDateIndo(selectedReq?.tgl2, "short")}
                    </span>
                    <span className="hidden md:inline">
                      {formatDateIndo(selectedReq?.tgl2, "long")}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-1 w-full justify-between mt-1 text-sm">
                <p>Duration</p>
                <p>{selectedReq?.duration} Day(s)</p>
              </div>
              <div
                className={`flex w-full flex-col outline-1 p-2 outline-slate-400 rounded-xl mt-3 ${showHistorySection() ? "overflow-y-auto scrollbar-hidden" : ""}`}
              >
                <div className="flex w-full justify-between text-sm gap-10">
                  <p>Desc.</p>
                  <p className="text-right">{selectedReq?.keterangan}</p>
                </div>
                <div className="flex w-full justify-between text-sm">
                  <p>Req. Date</p>
                  <p>{formatDateIndo(selectedReq?.log_date)}</p>
                </div>
                {selectedReq?.leave_id === 1 &&
                  selectedReq?.medical_certificate_name && (
                    <div className="flex justify-between text-sm">
                      <p>Medical Certificate</p>
                      {selectedReq?.medical_certificate_mime?.startsWith(
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
                              selectedReq?.medical_certificate_original_name,
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
                              selectedReq?.medical_certificate_original_name,
                              20,
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                <div className="flex w-full justify-between text-sm">
                  <p>Decision Date</p>
                  <p>{formatDateIndo(selectedReq?.approved_log) ?? "-"}</p>
                </div>
                <div className="flex w-full justify-between text-sm">
                  <p>Decision By</p>
                  <p>{selectedReq?.approver ?? "-"}</p>
                </div>
                {selectedReq?.rejection_notes && (
                  <div className="flex w-full gap-10 justify-between text-sm">
                    <p>Notes</p>
                    <p className="text-right">
                      {selectedReq?.rejection_notes ?? "-"}
                    </p>
                  </div>
                )}
                {selectedReq?.revision_status === 1 && (
                  <>
                    <hr className="text-slate-400 my-2 shadow-sm" />
                    <div className="flex w-full justify-between text-sm">
                      <p className="font-medium">Revision</p>
                      <div
                        className={`px-1.5 py-0.5 mt-0.5 rounded-full outline-1 text-xs h-fit ${
                          approvalStatusConfig[selectedReq?.revision_status]
                            ?.badgeClass ?? ""
                        }`}
                      >
                        {approvalStatusConfig[selectedReq?.revision_status]
                          ?.label ?? ""}
                      </div>
                    </div>
                    <div className="flex w-full mt-1.5 justify-between text-sm">
                      <p>Date Change</p>
                      <p>
                        {formatDateIndo(selectedReq?.old_tgl2) ||
                          formatDateIndo(selectedReq?.old_tgl1)}
                        {" → "}
                        {formatDateIndo(selectedReq?.new_tgl2) ||
                          formatDateIndo(selectedReq?.new_tgl1)}
                      </p>
                    </div>
                    <div className="flex w-full justify-between text-sm gap-10">
                      <p>Reason</p>
                      <p className="text-right">
                        {selectedReq?.revision_reason}
                      </p>
                    </div>
                    {revisionHistory.length > 0 && (
                      <div className="flex w-full justify-center mt-1.5 text-xs text-slate-500">
                        <button
                          className="cursor-pointer"
                          onClick={() => setOpenHistory(!openHistory)}
                        >
                          {showHistorySection()
                            ? "Hide request history"
                            : "Show request history"}
                        </button>
                      </div>
                    )}
                    <div
                      className={`flex flex-col mt-1 gap-2 transition-all duration-500 ease-in-out ${
                        showHistorySection()
                          ? "opacity-100 translate-y-0 max-h-60 pointer-events-auto"
                          : "opacity-0 -translate-y-4 max-h-0 pointer-events-none"
                      }`}
                    >
                      {revisionHistory.map((h) => (
                        <div key={h.id}>
                          <div className="flex w-full justify-between text-sm">
                            <p className="font-medium">
                              {formatDateIndo(h?.log_date)}
                            </p>
                            <div
                              className={`px-1.5 py-0.5 mt-0.5 rounded-full outline-1 text-xs h-fit ${
                                approvalStatusConfig[h?.fl_approve]
                                  ?.badgeClass ?? ""
                              }`}
                            >
                              {approvalStatusConfig[h?.fl_approve]?.label ?? ""}
                            </div>
                          </div>
                          <div className="flex w-full mt-1.5 justify-between text-sm">
                            <p>Date Change</p>
                            <p>
                              {formatDateIndo(h?.old_tgl2) ||
                                formatDateIndo(h?.old_tgl1)}
                              {" → "}
                              {formatDateIndo(h?.new_tgl2) ||
                                formatDateIndo(h?.new_tgl1)}
                            </p>
                          </div>
                          <div className="flex w-full justify-between text-sm gap-10">
                            <p>Reason</p>
                            <p className="text-right">{h?.reason}</p>
                          </div>
                          {h?.rejection_notes && (
                            <div className="flex w-full justify-between text-sm gap-10">
                              <p>Notes</p>
                              <p className="text-right">{h?.rejection_notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div
                className={`w-full space-y-2 mt-4 transition-all duration-500 ease-in-out
                               ${
                                 actionMode === "endLeaveEarly"
                                   ? "opacity-100 translate-y-0 max-h-60 pointer-events-auto"
                                   : "opacity-0 -translate-y-4 max-h-0 pointer-events-none"
                               }`}
              >
                <hr className="text-slate-400" />
                <FloatingDate
                  id={"toDate"}
                  label={"Last day of leave"}
                  fontThickness="font-normal"
                  inputFontSize="font-normal!"
                  border="border-1 rounded-xl!"
                  borderColorDefault="border-slate-400"
                  selectedDate={revisedDate}
                  setSelectedDate={setRevisedDate}
                  displayValue={revisedDisplay}
                  setDisplayValue={setRevisedDisplay}
                />
                <FloatingTextArea
                  id="Reason"
                  value={endLeaveEarlyNotes}
                  onValueChange={setEndLeaveEarlyNotes}
                  border="border rounded-xl!"
                  borderColorDefault="border-slate-400"
                  inputFontThickness="font-normal"
                  labelFontThickness="font-normal"
                  isDisable={!!selectedReq?.LeaveEarly_notes}
                />
              </div>
              {actionMode === "endLeaveEarly" && (
                <div className="flex gap-8 my-5">
                  <Button
                    btnLabel={"Cancel"}
                    handleClick={() => {
                      setActionMode(null);
                    }}
                    btnColor="bg-slate-200 hover:bg-slate-400 outline-1 outline-slate-600"
                    btnWidth=""
                    textSize="text-base"
                  />
                  <Button
                    btnLabel={"Submit"}
                    handleClick={submitRevise}
                    btnColor="bg-blue-200 hover:bg-blue-400 outline-1 outline-blue-600"
                    btnWidth=""
                    textSize="text-base"
                  />
                </div>
              )}
              {(showButtonEndEarly(selectedReq) ||
                selectedReq?.fl_approve === 1) && (
                <div className={`flex justify-evenly w-full mt-1 gap-2`}>
                  {showButtonEndEarly(selectedReq) && (
                    <Button
                      btnLabel="End Leave Early"
                      btnWidth="py-1"
                      btnColor="outline-1 outline-slate-400 hover:outline-slate-600 hover:text-black/60!"
                      textSize="text-sm shadow-sm!"
                      handleClick={() => setActionMode("endLeaveEarly")}
                    />
                  )}
                  {selectedReq?.fl_approve === 1 &&
                    actionMode !== "endLeaveEarly" && (
                      <Button
                        btnLabel={
                          pdfLoader.loading ? (
                            <BtnLoading label={"Downloading PDF"} />
                          ) : (
                            <div>Download PDF</div>
                          )
                        }
                        btnWidth="w-36 px-1!"
                        btnColor="outline-1 outline-slate-400 hover:outline-slate-600 hover:text-black/60!"
                        textSize="text-sm shadow-sm!"
                        handleClick={handleGeneratePDF}
                      />
                    )}
                </div>
              )}
            </ModalPanel>
          )}

          {mode === "preview" && (
            <div className="flex items-center justify-center w-full relative ">
              <img
                src={previewImage?.preview}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[70vh] max-w-[70vw] rounded-lg shadow-2xl object-contain"
              />
            </div>
          )}
        </Modal>

        {popup && (
          <PopUpMenu
            position={popup.rect}
            open={popupOpen}
            onClose={handleClosePopup}
            popupWidth="w-50 lg:w-60"
          >
            <div className="flex flex-1 flex-col gap-2 p-1 m-1 text-xs ">
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

        <AttachmentPreview
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          file={{
            url: previewFiles,
            mime: selectedReq?.medical_certificate_mime,
            originName: selectedReq?.medical_certificate_original_name,
          }}
          loading={previewFileLoader.loading}
        />
      </div>
    </>
  );
}
