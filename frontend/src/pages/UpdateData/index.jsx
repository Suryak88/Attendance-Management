import { toast } from "sonner";
import api from "../../utils/axiosInstance";
import { formatDateIndo, formatLocalDate } from "../../utils/Date";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import BtnLoading from "../../components/atoms/BtnLoading";
import FilterDate from "../../components/organisms/FilterPopUp/contents/FilterDate";
import { useCallback, useEffect, useState } from "react";
import FloatingDate from "../../components/atoms/FloatingDate";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import Button from "../../components/atoms/Button";
import { useModal } from "../../hooks/useModal";
import FormSuccess from "../../components/organisms/Modal/contents/FormSuccess";

export default function UpdateData() {
  const [formKey, setFormKey] = useState(0);
  const [startDisplay, setStartDisplay] = useState("");
  const [endDisplay, setEndDisplay] = useState("");
  const [form, setForm] = useState({
    startDate: null,
    endDate: null,
  });
  const hadirrLoader = useDelayedLoading();
  const resetForm = useCallback(() => {
    setTimeout(() => {
      setForm({
        startDate: null,
        endDate: null,
      });
      setStartDisplay("");
      setEndDisplay("");
    }, 300);
    setFormKey((k) => k + 1);
  }, []);
  const modal = useModal(resetForm);
  const { openWithMode, open, close, mode } = modal;
  const isEndDateInvalid =
    form.startDate && form.endDate && form.endDate < form.startDate;
  const [inserted, setInserted] = useState(0);
  const [failedInserted, setFailedInserted] = useState([]);

  function setField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleUpdateSales(group) {
    if (!form.startDate || !form.endDate) {
      toast.error("Enter valid date!");
      return;
    }
    if (isEndDateInvalid) {
      toast.error("Invalid date");
      return;
    }
    hadirrLoader.startLoading();
    try {
      const res = await api.post(
        "/hadirr/",
        {},
        {
          params: {
            startDate: formatLocalDate(form.startDate),
            endDate: formatLocalDate(form.endDate),
            group,
          },
        },
      );
      setInserted(res.data.inserted);
      setFailedInserted(res.data.failedDates || []);

      openWithMode("salesUpdated");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to Update from Hadirr",
      );
    } finally {
      hadirrLoader.stopLoading();
    }
  }

  function resetModal() {}

  function handleCloseModal() {
    close();
    setTimeout(() => {
      resetForm();
    }, 300);
  }

  return (
    <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0">
      <div className="p-3 font-normal">
        <h3 className="text-xl md:text-2xl font-medium">
          Update Attendance Data
        </h3>
      </div>
      <div className="w-full flex flex-1 flex-col mt-5 space-y-2 min-h-0">
        <div
          className="flex flex-col mx-2 px-3 gap-2 py-2 outline-1 outline-slate-400 shadow-sm rounded-lg max-w-xl md:mx-auto lg:mx-4"
          key={formKey}
        >
          <div className="">
            <h3 className="font-medium text-xl">Hadirr</h3>
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex gap-3">
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
            <div className="flex lg:flex-col flex-1 gap-3 w-full justify-center items-center">
              <button
                onClick={() => handleUpdateSales("SALES")}
                className="flex px-2 py-1 w-35 -translate-y-3 bg-slate-100 rounded-lg shadow-sm font-medium text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md items-center gap-2 disabled:text-black/40"
                disabled={hadirrLoader.loading}
              >
                {hadirrLoader.loading ? (
                  <div className="flex w-full justify-center">
                    <BtnLoading label={"Updating "} />
                  </div>
                ) : (
                  <div className="flex w-full my-0.5 justify-center">
                    Update Data Sales
                  </div>
                )}
              </button>
              <button
                onClick={() => handleUpdateSales("COLLECTOR")}
                className="flex px-2 py-1 w-40 -translate-y-3 bg-slate-100 rounded-lg shadow-sm font-medium text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md items-center gap-2 disabled:text-black/40"
                disabled={hadirrLoader.loading}
              >
                {hadirrLoader.loading ? (
                  <div className="flex w-full justify-center">
                    <BtnLoading label={"Updating "} />
                  </div>
                ) : (
                  <div className="flex w-full my-0.5 justify-center">
                    Update Data Collector
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {hadirrLoader.loading && (
        <div className="fixed inset-0 z-9990 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3">
            <BtnLoading />

            <p className="font-medium">Updating attendance data...</p>

            <p className="text-sm text-slate-500">Please wait</p>
          </div>
        </div>
      )}

      <Modal openModal={open} onClose={handleCloseModal}>
        {mode === "salesUpdated" && (
          <ModalPanel
            title={`Data Updated`}
            subtitle={`${inserted} data inserted`}
            handleClose={close}
          >
            <div className="flex flex-col w-full gap-2 mt-3 mb-5">
              {failedInserted.length === 0 ? (
                <FormSuccess />
              ) : (
                <div className="flex flex-col w-full p-2 outline-1 rounded-lg outline-red-400 bg-red-50 min-h-0 overflow-y-auto max-h-75">
                  <h3 className="font-medium">Failed:</h3>
                  <div className="flex flex-col gap-1">
                    {failedInserted.map((item, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{item.date}</span>
                        {" - "}
                        {item.message}
                      </div>
                    ))}
                  </div>
                  <p>Total {failedInserted.length} failed</p>
                </div>
              )}
            </div>
            <Button handleClick={close} btnLabel={"OK"} />
          </ModalPanel>
        )}
      </Modal>
    </div>
  );
}
