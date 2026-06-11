import { useContext, useEffect, useRef, useState } from "react";
import TableChild from "../../components/atoms/TableChild";
import HeadPage from "../../components/organisms/HeadPage";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import Card from "../../components/organisms/Card";
import Button from "../../components/atoms/Button";
import { AuthContext } from "../../context/AuthContext";
import { useFilter } from "../../hooks/useFilter";
import {
  formatDateFromPicker,
  formatDateIndo,
  formatLocalDate,
  formatMySQLTime,
  minuteConvert,
} from "../../utils/Date";
import { approvalStatusConfig } from "../../utils/statusColor";
import api from "../../utils/axiosInstance";
import { toast } from "sonner";
import FilterPopup from "../../components/organisms/FilterPopUp";
import FilterDate from "../../components/organisms/FilterPopUp/contents/FilterDate";
import FilterSelect from "../../components/organisms/FilterPopUp/contents/FIlterSelect";
import { FilterStatusApproval } from "../../data/FilterStatusApproval";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FormContent from "../../components/organisms/Modal/contents/FormContent";
import { useModal } from "../../hooks/useModal";
import FloatingTextArea from "../../components/atoms/FloatingTextArea";
import FormSuccess from "../../components/organisms/Modal/contents/FormSuccess";
import ActionFormSection from "../../components/organisms/ActionFormSection";
import BtnLoading from "../../components/atoms/BtnLoading";
import { overtimeApprovalHead } from "../../data/overtimeApprovalTableHead.js";
import PopUpMenu from "../../components/organisms/PopUpMenu/index.jsx";
import SidebarButton from "../../components/atoms/SidebarButton/index.jsx";
import CheckBox from "../../components/atoms/CheckBox/index.jsx";
import { truncateText } from "../../utils/truncateText.js";
import { Check, EllipsisVertical, X } from "lucide-react";

export default function OvertimeApproval() {
  const { user, subordinates } = useContext(AuthContext);
  const [request, setRequest] = useState([]);
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
  const STORAGE_KEY = "overtime-approval-filter";
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
  const skeletonLoop = Array.from({ length: 5 });
  const requestIdRef = useRef(0);
  const submitLoader = useDelayedLoading();
  const submitBulkLoader = useDelayedLoading();
  const [rowPopup, setRowPopup] = useState(null);
  const [rowPopupOpen, setRowPopupOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);

  useEffect(() => {
    if (!user) return;

    setDisplayStDate(formatDateFromPicker(firstDay));
    setDisplayEnDate(formatDateFromPicker(today));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchOvertimeRequests();
  }, [user, activeFilter]);

  useEffect(() => {
    if (!rowPopup) return;

    const handleScroll = () => handleCloseRowPopup();

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [rowPopup]);

  async function fetchOvertimeRequests() {
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
      .get(`/overtimeApproval/?${params.toString()}`)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;

        setRequest(res.data);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Failed to fetch data!");
      })
      .finally(() => {
        if (requestId === requestIdRef.current) stopLoading();
      });
  }

  async function submitReject(e) {
    e.preventDefault();
    if (!rejectNotes || rejectNotes.trim() === "") {
      toast.error("Silahkan isi rejection notes");
      return;
    }

    try {
      submitLoader.startLoading();
      await api.put(`/overtimeApproval/reject/${selectedRequest.id}`, {
        notes: rejectNotes,
      });
      await fetchOvertimeRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel");
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function submitApprove(e) {
    e.preventDefault();

    try {
      submitLoader.startLoading();
      await api.put(`/overtimeApproval/approve/${selectedRequest.id}`);
      await fetchOvertimeRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit!");
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function submitBulkApprove(e) {
    e.preventDefault();

    try {
      submitBulkLoader.startLoading();
      await api.put(`/overtimeApproval/bulk-approve`, {
        ids: checkedIds,
      });

      setCheckedIds([]);
      await fetchOvertimeRequests();
      showSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to approve!");
    } finally {
      submitBulkLoader.stopLoading();
    }
  }

  function handleClickFilter(e) {
    e.stopPropagation();
    if (submitBulkLoader.loading) return;
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

  function resetForm() {
    setSelectedRequest(null);
    setActionMode(null);
    setRejectNotes("");
  }

  function handleCloseFilter() {
    setFilterPopupOpen(false);
    setTimeout(() => {
      setFilterPopup(null);
    }, 200);
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

  function handleClose() {
    close();
    setTimeout(() => {
      resetForm();
    }, 300);
  }

  function handleClickMoreRow(e, index, log) {
    e.stopPropagation();
    if (rowPopup?.index === index && rowPopupOpen) {
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

  return (
    <>
      <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0">
        <HeadPage
          label={"Overtime Approval"}
          employeeName={activeEmployee?.label}
          handleClick={handleClickFilter}
        />

        <div className="w-full flex flex-1 flex-col space-y-2 min-h-0">
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
              className={`px-2 py-1 w-40 bg-slate-100 rounded-xl shadow-sm font-medium text-xs lg:text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md items-center ${checkedIds.length < 1 ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"} transition-all disabled:text-black/40`}
              onClick={submitBulkApprove}
              disabled={submitBulkLoader.loading}
            >
              {submitBulkLoader.loading ? (
                <div className="flex w-full justify-center">
                  <BtnLoading label={"Processing"} />
                </div>
              ) : (
                <div className="my-0.5">
                  Approve {checkedIds.length}{" "}
                  {checkedIds.length > 1 ? "Overtimes" : "Overtime"}
                </div>
              )}
            </button>
          </div>
          <div className="flex bg-red-400 text-white p-2 mx-2 rounded-2xl font-bold">
            {overtimeApprovalHead.map((col) => (
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
                      <div className="flex justify-start w-full max-w-25 xl:max-w-40 xl:gap-2">
                        <CheckBox
                          id="Chck"
                          label={item.fullname}
                          truncateSize={"8"}
                          status={item.fl_approve}
                          checked={checkedIds.includes(item.id)}
                          onClick={() =>
                            handleToggleCheck(item.id, item.fl_approve)
                          }
                        />
                      </div>
                    </TableChild>
                    <TableChild>{formatDateIndo(item?.tgl)}</TableChild>
                    <TableChild>{Number(item?.real_hours)} jam</TableChild>
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
            {/* {loading CARD DESIGN TIDAK JADI
              ? skeletonLoop.map((m, index) => (
                  <Card key={index}>
                    <div className="text-transparent">
                      <div className="flex justify-between mb-3">
                        <h3 className="skeleton rounded-2xl bg-slate-200 px-2 font-medium text-lg">
                          Loading
                        </h3>
                        <div
                          className={`skeleton px-2 py-0.5 mt-1 rounded-full outline-none bg-slate-200 text-sm h-fit`}
                        >
                          Loading
                        </div>
                      </div>
                      <div className="skeleton flex rounded-xl p-2 gap-2 mt-5 mb-3 bg-slate-200 outline-1 outline-slate-300 text-sm">
                        <div className="flex flex-1 flex-col items-center">
                          <p className="font-medium text-lg">Loading</p>
                        </div>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <div className="skeleton flex flex-1 justify-between bg-slate-200 rounded-2xl">
                          <p>Clock-out</p>
                        </div>
                        <div className="skeleton flex flex-1 justify-between bg-slate-200 rounded-2xl">
                          <p>Date</p>
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
                    <div className="flex justify-between mb-3">
                      <h3 className="font-medium text-lg">{item?.fullname}</h3>
                      <div
                        className={`px-2 py-0.5 mt-1 rounded-full outline-1 text-sm h-fit ${
                          approvalStatusConfig[item?.fl_approve]?.badgeClass ??
                          ""
                        }`}
                      >
                        {approvalStatusConfig[item?.fl_approve]?.label ?? ""}
                      </div>
                    </div>
                    <div className="flex rounded-xl p-2 gap-2 mt-5 mb-3 outline-1 outline-slate-400 text-sm">
                      <div className="flex flex-1 flex-col items-center">
                        <p className="font-medium text-lg">
                          Lembur - {Number(item?.real_hours)} jam
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <div className="flex flex-1 justify-between">
                        <p>Clock-out</p>
                        <p>{formatMySQLTime(item?.pulang)}</p>
                      </div>
                      <div className="flex flex-1 justify-between">
                        <p>Date</p>
                        <p>{formatDateIndo(item?.tgl)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex mb-2">
                      <Button
                        btnLabel={"View Details"}
                        btnColor="outline-1 outline-slate-300 hover:outline-slate-500 hover:text-black/60!"
                        textSize="text-base shadow-sm!"
                        handleClick={() => {
                          openModal();
                          setSelectedRequest(item);
                          setRejectNotes(item.rejection_notes ?? "");
                        }}
                      />
                    </div>
                  </Card>
                ))} */}
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
                setSelectedRequest(rowPopup.log);
                setRejectNotes(rowPopup.log.rejection_notes ?? "");
              }}
            />
          </PopUpMenu>
        )}

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
            <div className="w-full transition-all duration-300">
              <ModalPanel
                title={selectedRequest?.fullname}
                titlePosition="text-left"
                subtitle={`${selectedRequest?.jabatan} - ${selectedRequest?.divisi}`}
                handleClose={handleClose}
                badgeColor={statusConfig?.badgeClass ?? ""}
                badgeLabel={statusConfig?.label ?? ""}
              >
                <FormContent>
                  <div className="flex w-full flex-col">
                    <div className="flex font-medium mb-1">
                      <p>Lembur</p>
                    </div>
                    <div className="flex justify-around rounded-xl p-2 gap-2 outline-1 outline-slate-400 shadow-sm font-medium">
                      <div className="flex flex-1 flex-col text-center">
                        <p className="text-sm text-slate-500">Real Duration</p>
                        <p className="text-base lg:text-lg">
                          {Number(selectedRequest?.real_hours)} jam
                        </p>
                      </div>
                      <div className="flex flex-1 flex-col text-center">
                        <p className="text-sm text-slate-500">Date</p>
                        <p className="text-base md:hidden">
                          {formatDateIndo(selectedRequest?.tgl, "short")}
                        </p>
                        <p className="hidden md:flex justify-center text-base lg:text-lg">
                          {formatDateIndo(selectedRequest?.tgl, "long")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 justify-between text-center font-medium">
                      <p className="text-base">Overtime Duration</p>
                      <p className="text-base lg:text-lg">
                        {Number(selectedRequest?.overtime_hours)} jam
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col mt-2">
                      <div className="flex justify-between">
                        <p>Clock-in</p>
                        <p>{formatMySQLTime(selectedRequest?.masuk)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p>Clock-out</p>
                        <p>{formatMySQLTime(selectedRequest?.pulang)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p>Clock-out rounded</p>
                        <p>
                          {formatMySQLTime(selectedRequest?.pulang_rounded)}
                        </p>
                      </div>
                      {selectedRequest?.telat > 0 && (
                        <div className="flex justify-between">
                          <p>Late</p>
                          <p>{minuteConvert(selectedRequest?.telat)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <ActionFormSection
                    actionMode={actionMode}
                    appear={
                      actionMode === "reject" ||
                      selectedRequest?.fl_approve == 2
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

                  {actionMode != "reject" &&
                    selectedRequest?.fl_approve == 0 && (
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
                          btnColor="bg-green-300 hover:bg-green-400 outline-1 outline-green-600"
                          withIcon="leading-none"
                          btnWidth=""
                          handleClick={submitApprove}
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
      </div>
    </>
  );
}
