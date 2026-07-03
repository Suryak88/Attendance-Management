import { useContext, useEffect, useState, useCallback, useRef } from "react";
import Button from "../../components/atoms/Button";
import FloatingDate from "../../components/atoms/FloatingDate";
import FloatingTextArea from "../../components/atoms/FloatingTextArea";
import FloatingTime from "../../components/atoms/FloatingTime";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import {
  formatLocalDate,
  formatMySQLTime,
  mergeTimeToDate,
  isoUtcToMySQLLocal,
  formatDateIndo,
  formatDateFromPicker,
} from "../../utils/Date";
import { useModal } from "../../hooks/useModal";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FormSuccess from "../../components/organisms/Modal/contents/FormSuccess";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import HistoryBar from "../../components/organisms/HistoryBar";
import { approvalStatusConfig } from "../../utils/statusColor";
import { truncateText } from "../../utils/truncateText";
import { enrichCorrection } from "../../utils/correctionFormatter";
import FormDelete from "../../components/organisms/Modal/contents/FormDelete";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import BtnLoading from "../../components/atoms/BtnLoading";
import CheckBox from "../../components/atoms/CheckBox";

export default function AttendanceCorrection() {
  const { state } = useLocation();
  const [dateDisplay, setDateDisplay] = useState("");
  const [clockInDisplay, setClockInDisplay] = useState("");
  const [clockOutDisplay, setClockOutDisplay] = useState("");
  const [form, setForm] = useState({
    corrDate: null,
    clockIn: null,
    clockOut: null,
    desc: "",
    lateExcused: false,
    earlyLeaveExcused: false,
  });
  const { user } = useContext(AuthContext);
  const [formKey, setFormKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [lockedField, setLockedField] = useState({
    clockIn: false,
    clockOut: false,
  });
  const resetForm = useCallback(() => {
    setTimeout(() => {
      setForm({
        corrDate: null,
        clockIn: null,
        clockOut: null,
        desc: "",
        lateExcused: false,
        earlyLeaveExcused: false,
      });
      setDateDisplay("");
      setClockInDisplay("");
      setClockOutDisplay("");
      setErrorMsg("");
      setLockedField({
        clockIn: false,
        clockOut: false,
      });
    }, 300);
    setFormKey((k) => k + 1);
  }, []);
  const resetModal = useCallback(() => {
    setSelectedReq(null);
  });
  const modal = useModal(resetModal);
  const { showSuccess, open, close, mode, openModal, deleteModal } = modal;
  const [reqHistory, setReqHistory] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const statusConfig = approvalStatusConfig[selectedReq?.fl_approve];
  const { loading, startLoading, stopLoading } = useDelayedLoading();
  const submitLoader = useDelayedLoading();
  const skeletonLoop = Array.from({ length: 3 });
  const [importedUntil, setImportedUntil] = useState(null);
  const attendanceImported = isAttendanceImported(form.corrDate, importedUntil);

  useEffect(() => {
    if (!form.corrDate || !user) return;
    const initial = async () => {
      const importedUntil = await fetchLastSynced();
      await fetchDataByDate(importedUntil);
    };

    initial();
  }, [form.corrDate, user]);

  useEffect(() => {
    setClockInDisplay(formatMySQLTime(form.clockIn));
    setClockOutDisplay(formatMySQLTime(form.clockOut));
  }, [form.clockIn, form.clockOut]);

  useEffect(() => {
    if (!state) return;
    const date = new Date(state.date);
    setField("corrDate", date);
    setDateDisplay(formatDateFromPicker(date));
  }, [state]);

  useEffect(() => {
    if (!user) return;
    fetchReqHistory();
  }, [user]);

  function setField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.corrDate) {
      toast.error("Please enter Correction Date");
      return;
    }
    if (attendanceImported) {
      if (!form.clockIn) {
        toast.error("Please enter Clock-in Time");
        return;
      }
      if (!form.clockOut) {
        toast.error("Please enter Clock-out Time");
        return;
      }
    } else {
      if (!form.lateExcused && !form.earlyLeaveExcused) {
        toast.error("Please select at least one excuse type");
        return;
      }
    }
    if (!form.desc || form.desc.trim() === "") {
      toast.error("Please enter the description!");
      return;
    }

    try {
      submitLoader.startLoading();
      await api.post("/attendanceCorrection/", {
        name: user.username,
        date: formatLocalDate(form.corrDate),
        clockIn: form.clockIn,
        clockOut: form.clockOut,
        description: form.desc,
        lateExcused: form.lateExcused,
        earlyLeaveExcused: form.earlyLeaveExcused,
      });
      resetForm();
      fetchReqHistory();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function fetchLastSynced() {
    try {
      const res = await api.get(`/attendanceCorrection/lastSynced/`, {
        params: {
          date: formatLocalDate(form.corrDate),
        },
      });

      setImportedUntil(res.data);

      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  function isAttendanceImported(date, importedUntil) {
    return new Date(date) <= new Date(importedUntil);
  }

  async function fetchDataByDate(importedUntil) {
    const date = formatLocalDate(new Date(form.corrDate));
    const attendanceImported = isAttendanceImported(
      form.corrDate,
      importedUntil,
    );
    const res = await api.get(
      `/attendanceLog/log?startDate=${date}&endDate=${date}`,
    );
    // .then((res) => {
    //   setField("clockIn", res.data[0].masuk);
    //   setField("clockOut", res.data[0].pulang);
    // })
    // .catch((error) => console.error(error));
    const data = res.data?.[0];
    setField("clockIn", isoUtcToMySQLLocal(data?.masuk) ?? null);
    setField("clockOut", isoUtcToMySQLLocal(data?.pulang) ?? null);

    setLockedField({
      clockIn: attendanceImported ? !!data?.masuk : true,
      clockOut: attendanceImported ? !!data?.pulang : true,
    });
  }

  async function fetchReqHistory() {
    startLoading();
    await api
      .get("/attendanceCorrection/")
      .then((res) => {
        const enrichedData = res.data.map(enrichCorrection);
        setReqHistory(enrichedData);
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Failed to fetch request history",
        );
        console.error(error);
      })
      .finally(stopLoading);
  }

  async function handleCancel(e) {
    e.preventDefault();

    try {
      await api.put(`attendanceCorrection/cancel/${selectedReq.id}`);
      fetchReqHistory();
      showSuccess();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Gagal membatalkan request",
      );
    }
  }

  return (
    <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0 overflow-auto scrollbar-hidden">
      <div className="p-3 font-normal">
        <h3 className="text-xl md:text-2xl font-medium">
          Attendance Correction
        </h3>
      </div>

      <div
        className={`flex flex-col bg-slate-100 mx-4 my-5 px-3 pt-3 pb-2 rounded-xl border  border-slate-400 shadow-sm overflow-auto scrollbar-hidden min-h-[420px]
            md:max-w-2xl md:flex-row md:mx-auto md:min-h-[420px] 
            lg:mx-4 lg:min-h-[440px] lg:w-fit
            xl:max-w-3xl `}
        key={formKey}
      >
        <div className="flex">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between mb-8 items-start">
              <h3 className="font-medium text-lg md:text-xl text-left">
                Attendance Correction Form
              </h3>
            </div>
            <div className="flex flex-col items-center">
              <FloatingDate
                id="corrDate"
                label="Correction Date"
                message="Please enter valid date"
                selectedDate={form.corrDate}
                setSelectedDate={(v) => setField("corrDate", v)}
                displayValue={dateDisplay}
                setDisplayValue={setDateDisplay}
                border="border"
                fontThickness="font-normal"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col flex-1 items-end">
                <FloatingTime
                  id="clockIn"
                  label="Clock-in"
                  message="Please enter valid time"
                  value={form.clockIn}
                  border="border"
                  fontThickness="font-normal"
                  onChange={(hhmm) => {
                    const mysqlDateTime = mergeTimeToDate(form.corrDate, hhmm);
                    setField("clockIn", mysqlDateTime);
                  }}
                  displayValue={clockInDisplay}
                  setDisplayValue={setClockInDisplay}
                  isDisable={lockedField.clockIn}
                />
              </div>
              <div className="flex flex-col flex-1 items-start">
                <FloatingTime
                  id="clockOut"
                  label="Clock-out"
                  message="Please enter valid time"
                  value={form.clockOut}
                  border="border"
                  fontThickness="font-normal"
                  onChange={(hhmm) => {
                    const mysqlDateTime = mergeTimeToDate(form.corrDate, hhmm);
                    setField("clockOut", mysqlDateTime);
                  }}
                  displayValue={clockOutDisplay}
                  setDisplayValue={setClockOutDisplay}
                  isDisable={lockedField.clockOut}
                />
              </div>
            </div>
            <div
              className={`flex transition-all duration-300 ${!attendanceImported ? "max-h-5 opacity-100 -translate-y-5" : "max-h-0 opacity-0 -translate-y-8"}`}
            >
              <CheckBox
                id={"izinTelat"}
                label={"Izin Terlambat"}
                isTruncate={false}
                checked={form.lateExcused}
                onClick={() => setField("lateExcused", !form.lateExcused)}
              />
              <CheckBox
                id={"izinPulcep"}
                label={"Izin Pulang Cepat"}
                isTruncate={false}
                checked={form.earlyLeaveExcused}
                onClick={() =>
                  setField("earlyLeaveExcused", !form.earlyLeaveExcused)
                }
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
            <div className="flex flex-col justify-center items-center my-3">
              <p
                className={`animate-bounce transition-all duration-300 ease-in-out text-base font-semibold text-red-500 text-center mb-2 ${
                  errorMsg
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"
                }`}
              >
                {errorMsg}
              </p>
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
          </form>
        </div>
      </div>

      <Modal
        openModal={open}
        onClose={close}
        contentWidth={mode === "form" ? "w-7/8 lg:w-sm" : "w-3/4 lg:w-fit"}
      >
        {mode === "success" && (
          <ModalPanel
            title={`${selectedReq ? "Request Cancelled" : "Form Sent!"}`}
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
                {selectedReq?.thumbnail.name}
              </p>
              <div className="flex justify-evenly w-full rounded-xl p-2 gap-2 outline-1 outline-slate-400 shadow-sm font-medium text-sm text-center lg:text-base">
                <div className="flex flex-col">
                  <p className=" text-slate-500">Date</p>
                  <p>{formatDateIndo(selectedReq?.tgl)}</p>
                </div>
                <div className="flex flex-col">
                  <p className=" text-slate-500">
                    {selectedReq?.thumbnail.label}
                  </p>
                  <p>
                    {selectedReq?.thumbnail.time ??
                      selectedReq?.thumbnail.value}
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
            title={selectedReq?.thumbnail.name}
            titlePosition="left"
            handleClose={close}
            badgeColor={statusConfig?.badgeClass ?? ""}
            badgeLabel={statusConfig?.label ?? ""}
          >
            <div className="flex flex-col gap-1 flex-1 w-full lg:mb-1.5">
              <div className="flex justify-evenly w-full rounded-xl p-2 gap-2 outline-1 outline-slate-400 shadow-sm font-medium text-center text-lg">
                <div className="flex flex-col">
                  <p className="text-sm text-slate-500">Date</p>
                  <p>{formatDateIndo(selectedReq?.tgl)}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-slate-500">
                    {selectedReq?.thumbnail.label}
                  </p>
                  <p>
                    {selectedReq?.thumbnail.time ??
                      selectedReq?.thumbnail.value}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col p-2 rounded-xl gap-1">
              <div className="flex w-full justify-between text-sm gap-10">
                <p>Desc.</p>
                <p className="text-right">{selectedReq?.keterangan}</p>
              </div>
              <div className="flex w-full justify-between text-sm">
                <p>Req. Date</p>
                <p>{formatDateIndo(selectedReq?.log_date)}</p>
              </div>
              {selectedReq?.telat > 0 &&
                selectedReq?.correction_type !== "ISI_ABSEN_PULANG" &&
                selectedReq?.correction_type !== "IZIN_PULANG_CEPAT" && (
                  <div className="flex w-full justify-between text-sm">
                    <p>Late</p>
                    <p>{selectedReq?.lateFormatted}</p>
                  </div>
                )}

              {selectedReq?.pulang_cepat > 0 &&
                selectedReq?.correction_type !== "ISI_ABSEN_MASUK" &&
                selectedReq?.correction_type !== "IZIN_TELAT" && (
                  <div className="flex w-full justify-between text-sm">
                    <p>Early leave</p>
                    <p>{selectedReq?.earlyLeaveFormatted}</p>
                  </div>
                )}
              <hr className="my-1 shadow-sm text-slate-400" />
              <div className="flex w-full justify-between text-sm">
                <p>Decision Date</p>
                <p>{formatDateIndo(selectedReq?.approved_log) ?? "-"}</p>
              </div>
              <div className="flex w-full justify-between text-sm">
                <p>Decision By</p>
                <p>{selectedReq?.approver ?? "-"}</p>
              </div>
              {selectedReq?.fl_approve === 2 && (
                <div className="flex w-full gap-10 justify-between text-sm">
                  <p>Notes</p>
                  <p className="text-right">
                    {selectedReq?.rejection_notes ?? "-"}
                  </p>
                </div>
              )}
            </div>
          </ModalPanel>
        )}
      </Modal>

      <HistoryBar>
        <div className="flex flex-1 gap-5 items-center ">
          {reqHistory.length < 1 && !loading && (
            <div className="text-sm text-center">
              <p>No data</p>
            </div>
          )}
          {loading
            ? skeletonLoop.map((m, index) => (
                <div
                  className="flex flex-col w-55 lg:w-65 h-fit rounded-xl p-2 outline outline-slate-400 shadow-sm text-transparent"
                  key={index}
                >
                  <div className="flex py-1 justify-between items-center">
                    <div className="skeleton bg-slate-200 rounded-2xl px-2">
                      loading
                    </div>
                    <div className="flex items-center justify-end">
                      <div
                        className={`skeleton bg-slate-200 px-1.5 py-0.5 mt-1 rounded-full text-xs h-fit`}
                      >
                        loading
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 my-2 lg:mb-1.5">
                    <div className="skeleton flex justify-evenly w-full rounded-xl p-2 gap-2 outline-1 outline-slate-300 bg-slate-200 shadow-sm font-medium text-[13px] text-center lg:text-base">
                      <div className="flex flex-col">
                        <p className="text-xs">Date</p>
                        <p>00/00/0000</p>
                      </div>
                    </div>
                    <div className="flex mt-2 justify-between text-xs">
                      <p className="skeleton w-full bg-slate-200 rounded-2xl">
                        loading
                      </p>
                    </div>
                    <div className="flex justify-between text-xs">
                      <p className="skeleton w-full bg-slate-200 rounded-2xl">
                        loading
                      </p>
                    </div>
                  </div>
                  <div className={`flex justify-center mt-2 gap-2`}>
                    <Button
                      btnLabel="Details"
                      btnWidth=""
                      btnColor="skeleton bg-slate-200 outline-none outline-slate-400"
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
                    <div className="">{item?.thumbnail.name}</div>
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
                        <p className="text-xs text-slate-500">Date</p>
                        <p>{formatDateIndo(item?.tgl)}</p>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs text-slate-500">
                          {item?.thumbnail.label}
                        </p>
                        <p>{item?.thumbnail.time ?? item?.thumbnail.value}</p>
                      </div>
                    </div>
                    <div className="flex mt-2 justify-between text-xs">
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
    </div>
  );
}
