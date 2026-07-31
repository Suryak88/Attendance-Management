import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import FloatingDate from "../../components/atoms/FloatingDate";
import FloatingTextArea from "../../components/atoms/FloatingTextArea";
import Button from "../../components/atoms/Button";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import BtnLoading from "../../components/atoms/BtnLoading";
import {
  formatDateFromPicker,
  formatDateIndo,
  formatLocalDate,
  formatMySQLTime,
  minuteConvert,
} from "../../utils/Date";
import { useModal } from "../../hooks/useModal";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FormSuccess from "../../components/organisms/Modal/contents/FormSuccess";
import { toast } from "sonner";
import api from "../../utils/axiosInstance";
import HistoryBar from "../../components/organisms/HistoryBar";
import { approvalStatusConfig } from "../../utils/statusColor";
import { setDate } from "date-fns";
import FloatingTime from "../../components/atoms/FloatingTime";
import FloatingInput from "../../components/atoms/FloatingInput";
import { useLocation } from "react-router-dom";

export default function OvertimeRequest() {
  const { user } = useContext(AuthContext);
  const [dateDisplay, setDateDisplay] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [form, setForm] = useState({
    overtimeDate: null,
    desc: "",
    clockIn: null,
    clockOut: null,
    duration: null,
  });
  const skeletonRows = Array.from({ length: 3 });
  const submitLoader = useDelayedLoading();
  const historyLoader = useDelayedLoading();
  const { open, mode, close, showSuccess } = useModal(resetForm);
  const [ovtHistory, setOvtHistory] = useState([]);
  const descriptionRef = useRef(null);
  const { state } = useLocation();

  useEffect(() => {
    if (!user) return;
    fetchReqHistory();
  }, [user]);

  useEffect(() => {
    if (!form.overtimeDate || !user) return;
    fetchOvertimebyDate();
  }, [form.overtimeDate, user]);

  useEffect(() => {
    if (!state) return;
    const date = new Date(state.date);
    setField("overtimeDate", date);
    setDateDisplay(formatDateFromPicker(date));
  }, [state]);

  function setField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetForm() {
    setTimeout(() => {
      setForm({
        overtimeDate: null,
        desc: "",
      });
      setDateDisplay("");
    }, 300);
    setFormKey((k) => k + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.overtimeDate) {
      toast.error("Please enter Overtime Date");
      return;
    }
    if (!form.desc || form.desc.trim() === "") {
      toast.error("Please enter the description!");
      return;
    }

    try {
      submitLoader.startLoading();
      await api.post("/overtime/", {
        date: formatLocalDate(form.overtimeDate),
        description: form.desc,
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

  async function fetchReqHistory() {
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

  async function fetchOvertimebyDate() {
    const res = await api.get(`/overtime/`, {
      params: {
        date: formatLocalDate(form.overtimeDate),
      },
    });

    const data = res.data?.[0];
    setField("clockIn", data?.masuk ?? null);
    setField("clockOut", data?.pulang ?? null);
    setField("duration", data?.real_hours ?? null);
  }

  return (
    <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0 overflow-auto scrollbar-hidden ">
      <div className="p-3 font-normal">
        <h3 className="text-xl md:text-2xl font-medium">Overtime Request</h3>
      </div>

      <div
        className={`flex flex-col bg-slate-100 mx-4 mt-5 mb-10 px-3 pt-3 pb-2 rounded-xl border  border-slate-400 shadow-sm  
            md:max-w-2xl md:flex-row md:mx-auto 
            lg:mx-4 lg:w-fit 
            xl:max-w-3xl `}
        key={formKey}
      >
        <div className="flex">
          <form>
            <div className="flex justify-between mb-8 items-start">
              <h3 className="font-medium text-lg md:text-xl text-left">
                Overtime Request Form
              </h3>
            </div>
            <div className="flex flex-col items-center">
              <FloatingDate
                id="overtimeDate"
                label="Overtime Date"
                message="Please enter valid date"
                selectedDate={form.overtimeDate}
                setSelectedDate={(date) => setField("overtimeDate", date)}
                displayValue={dateDisplay}
                setDisplayValue={setDateDisplay}
                border="border"
                fontThickness="font-normal"
              />
            </div>
            <div
              className={`flex max-w-sm gap-2 mb-1 items-center transition-all duration-300 ${form.clockOut ? "opacity-100 -translate-y-2 pointer-events-auto" : "opacity-0 -translate-y-6 max-h-0 pointer-events-none"}`}
            >
              <div className="flex gap-2">
                <FloatingTime
                  id={"clockIn"}
                  label={"Clock-in"}
                  value={form.clockIn}
                  border="border"
                  fontThickness="font-normal"
                  displayValue={formatMySQLTime(form.clockIn)}
                  isDisable={true}
                />
                <FloatingTime
                  id={"clockOut"}
                  label={"Clock-out"}
                  value={form.clockOut}
                  border="border"
                  fontThickness="font-normal"
                  displayValue={formatMySQLTime(form.clockOut)}
                  isDisable={true}
                />
              </div>
              <div className="">
                <FloatingInput
                  id={"duration"}
                  value={`${Number(form.duration)} Jam`}
                  autoComplete="false"
                  border="border"
                  fontThickness="font-normal"
                  inputFontSize="font-normal"
                  isDisabled={true}
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <FloatingTextArea
                id="description"
                inputRef={descriptionRef}
                value={form.desc}
                onValueChange={(desc) => setField("desc", desc)}
                message={"Please enter the description"}
                border="border"
                labelFontThickness="font-normal"
              />
            </div>
            <div className="flex justify-center items-center my-3">
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

      <HistoryBar>
        <div className="flex flex-1 gap-5 items-center">
          {ovtHistory.length < 1 && !historyLoader.loading && (
            <div className="flex flex-1 justify-center items-center text-sm text-center ">
              <p className="font-medium">No Data</p>
            </div>
          )}
          {historyLoader.loading
            ? skeletonRows.map((m, index) => (
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
                    {item.overtime_status === "NEED_DESCRIPTION" &&
                      item.fl_approve !== 2 && (
                        <Button
                          btnLabel="Input Description"
                          btnWidth=""
                          btnColor="outline-1 outline-slate-400 hover:outline-slate-600 hover:text-black/60!"
                          textSize="text-xs shadow-sm!"
                          handleClick={() => {
                            setField("overtimeDate", new Date(item?.tgl));
                            setDateDisplay(
                              formatDateFromPicker(new Date(item?.tgl)),
                            );
                            descriptionRef.current?.focus();
                          }}
                        />
                      )}
                  </div>
                </div>
              ))}
        </div>
      </HistoryBar>

      <Modal openModal={open} onClose={close}>
        {mode === "success" && (
          <ModalPanel title={"Form Sent!"} handleClose={close}>
            <FormSuccess />
            <Button handleClick={close} btnLabel={"OK"} />
          </ModalPanel>
        )}
      </Modal>
    </div>
  );
}
