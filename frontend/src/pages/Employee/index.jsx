import {
  Blocks,
  Building,
  Building2,
  CalendarArrowDown,
  ChevronRight,
  ChevronsRight,
  CircleUserRound,
  GraduationCap,
  Hash,
  Plus,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FloatingInput from "../../components/atoms/FloatingInput";
import { useNavigate } from "react-router-dom";
import Card from "../../components/organisms/Card";
import logo from "../../assets/logo.png";
import { formatCapitalize } from "../../utils/formatCapitalize";
import { useState } from "react";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import HeadPage from "../../components/organisms/HeadPage";
import FilterPopup from "../../components/organisms/FilterPopUp";
import { useFilter } from "../../hooks/useFilter";
import FilterSelect from "../../components/organisms/FilterPopUp/contents/FIlterSelect";
import { useEffect } from "react";
import api from "../../utils/axiosInstance";
import { formatDateIndo, formatLocalDate } from "../../utils/Date";
import { useRef } from "react";
import Button from "../../components/atoms/Button";

export default function Employee() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { open, openWithMode, mode, close, showSuccess } = useModal(resetForm);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPopup, setFilterPopup] = useState(null);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [options, setOptions] = useState({
    perusahaan: [],
    divisi: [],
    departemen: [],
    jabatan: [],
  });
  const fetchEmployeeLoader = useDelayedLoading();
  const skeletonLoop = Array.from({ length: 3 });
  const requestIdRef = useRef(0);
  const STORAGE_KEY = "m-emp-filter";
  const savedFilter = sessionStorage.getItem(STORAGE_KEY);
  const defaultFilter = {
    perusahaan: "all",
    divisi: "all",
    departemen: "all",
    jabatan: "all",
  };
  const initialFilter = savedFilter
    ? {
        ...JSON.parse(savedFilter),
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
  const searchRef = useRef(null);

  const filteredEmployees = employees.filter((employee) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return true;

    return (
      employee.namalengkap?.toLowerCase().includes(keyword) ||
      employee.regnum?.toString().includes(keyword)
    );
  });

  useEffect(() => {
    if (!user) return;
    fetchFilterOptions();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchEmployee();
  }, [user, activeFilter]);

  function resetForm() {}

  async function fetchEmployee() {
    const requestId = ++requestIdRef.current;

    try {
      fetchEmployeeLoader.startLoading();

      const res = await api.get("/employee/", {
        params: {
          perusahaan: activeFilter.perusahaan,
          divisi: activeFilter.divisi,
          departemen: activeFilter.departemen,
          jabatan: activeFilter.jabatan,
        },
      });
      if (requestId !== requestIdRef.current) return;
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      if (requestId === requestIdRef.current) fetchEmployeeLoader.stopLoading();
    }
  }

  async function fetchFilterOptions() {
    try {
      const res = await api.get("/employeeForm/");

      setOptions({
        perusahaan: [
          { label: "ALL", value: "all" },
          ...res.data.company.map((c) => ({
            label: c.nama,
            value: c.id,
          })),
        ],
        divisi: [
          { label: "ALL", value: "all" },
          ...res.data.divisi.map((d) => ({
            label: d.nama,
            value: d.id,
          })),
        ],
        departemen: [
          { label: "ALL", value: "all" },
          ...res.data.departemen.map((d) => ({
            label: d.nama,
            value: d.id,
            divisi_id: d.divisi_id,
          })),
        ],
        jabatan: [
          { label: "ALL", value: "all" },
          ...res.data.jabatan.map((j) => ({
            label: j.nama,
            value: j.id,
            departemen_id: j.departemen_id,
          })),
        ],
      });
    } catch (error) {
      console.error(error);
    }
  }

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

  return (
    <div className="flex flex-col flex-1 bg-slate-100 ">
      <HeadPage label={"Employee"} handleClick={handleClickFilter} />
      <div className="flex w-full justify-between gap-3 px-3 mb-2 py-1">
        <div className="flex flex-1 items-center max-w-xs lg:max-w-sm xl:max-w-md rounded-2xl outline-1 outline-slate-400 my-1 xl:my-0 pl-2 bg-slate-100">
          <span className="flex items-center mr-1">
            <Search
              className="size-4"
              onClick={() => searchRef.current?.focus()}
            />
          </span>
          <input
            ref={searchRef}
            type="text"
            name="search"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee .."
            className="w-full md:px-1 focus:outline-none text-sm lg:text-base"
          />
          <span
            title={searchTerm ? "Clear search" : ""}
            className={`rounded-full p-1 ${searchTerm ? "hover:bg-slate-200 cursor-pointer" : "cursor-text"} transition-all  group`}
          >
            <X
              className={`size-5 ${searchTerm ? "opacity-100  pointer-events-auto" : "opacity-0 pointer-events-none"} transition-all group-hover:text-red-800`}
              onClick={() => setSearchTerm("")}
            />
          </span>
        </div>

        <button
          className="flex gap-1 my-1 px-2 py-1 justify-center items-center bg-slate-50 rounded-2xl shadow-sm font-medium text-xs lg:text-sm outline-1 cursor-pointer transition-all outline-slate-400 hover:text-black/60 hover:outline-slate-500 hover:shadow-md"
          onClick={() => navigate("/app/m-employee/new")}
        >
          <span>
            <Plus className="size-4.5" />
          </span>
          <p>New Employee</p>
        </button>
      </div>

      <div className="m-1 mt-3 p-2 flex flex-wrap gap-5 space-y-3 lg:gap-10 lg:space-y-5 justify-evenly items-center">
        {employees.length === 0 && !fetchEmployeeLoader.loading && (
          <div className="font-semibold my-3">No Data</div>
        )}
        {fetchEmployeeLoader.loading
          ? skeletonLoop.map((r, index) => (
              <div
                key={index}
                className="text-transparent bg-slate-100 shadow-md w-full max-w-2xs outline-1 outline-slate-300 rounded-xl p-3"
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="flex justify-center items-center">
                    <span className="skeleton flex items-center justify-center rounded-full outline-1 outline-slate-300 font-normal text-lg shadow-sm bg-slate-200 w-10 h-10 lg:w-12 lg:h-12 select-none">
                      Loading
                    </span>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <h3 className="skeleton rounded-xl text-center font-medium bg-slate-200">
                      {"Loading"}
                    </h3>
                  </div>
                  <div className="skeleton flex flex-col w-full outline-1 outline-slate-300 bg-slate-200 rounded-lg p-2">
                    <div className="flex items-start gap-1 text-sm">
                      <p className="">loading</p>
                    </div>
                    <div className="flex text-sm gap-1">
                      <p className="">loading</p>
                    </div>
                    <div className="flex text-sm gap-1">
                      <p className="">loading</p>
                    </div>
                  </div>
                  <div className="skeleton rounded-xl bg-slate-200 flex w-full justify-between text-xs">
                    <p>loading</p>
                  </div>
                </div>
              </div>
            ))
          : filteredEmployees.map((employee) => (
              <div
                key={employee?.regnum}
                className="bg-slate-100 shadow-md w-full max-w-2xs outline-1 outline-slate-300 rounded-xl p-3"
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="flex justify-center items-center">
                    {employee?.photo ? (
                      <img
                        src={logo}
                        alt="Profile"
                        className="w-10 h-10 object-cover rounded-full outline-1 outline-slate-400 select-none"
                      />
                    ) : employee?.namalengkap ? (
                      <span className="flex items-center justify-center rounded-full outline-1 outline-slate-400 text-slate-500 font-normal text-lg shadow-sm bg-slate-200 w-10 h-10 lg:w-12 lg:h-12 select-none">
                        {employee.namalengkap.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <CircleUserRound
                        strokeWidth={"1.25px"}
                        size={"32px"}
                        color={"#94a3b8"}
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <h3 className="text-base lg:text-lg text-center font-medium text-slate-600">
                      {formatCapitalize(employee?.namalengkap)}
                    </h3>
                    <p className="text-xs lg:text-sm text-center font-medium text-slate-500">
                      {formatCapitalize(employee?.jabatan_name)} -{" "}
                      {formatCapitalize(employee?.departemen_name)}
                    </p>
                  </div>
                  <div className="flex flex-col w-full outline-1 outline-slate-300 bg-slate-200 rounded-lg p-2">
                    <div className="flex items-start gap-1 text-sm text-slate-600">
                      <span className="my-0.5">
                        <Hash className="size-3.5" />
                      </span>
                      <p className="">{employee?.regnum}</p>
                    </div>
                    <div className="flex text-sm gap-1 text-slate-600">
                      <span className="my-0.5">
                        <Building2 className="size-3.5" />
                      </span>
                      <p className="">
                        {formatCapitalize(employee?.divisi_name)}
                      </p>
                    </div>
                    <div className="flex text-sm gap-1 text-slate-600">
                      <span className="my-0.5">
                        <Building className="size-3.5" />
                      </span>
                      <p className="">
                        {formatCapitalize(employee?.company_name)}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full justify-between text-slate-600 text-xs">
                    <p>
                      Joined at{" "}
                      {formatDateIndo(employee?.mulai_kerja ?? null) ?? "-"}
                    </p>
                    <div
                      title="Open Details"
                      className="flex items-center justify-center gap-0.5 group cursor-pointer"
                      onClick={() => {
                        openWithMode("detail");
                        setSelectedEmployee(employee);
                      }}
                    >
                      <p className="font-medium  group-hover:text-slate-400">
                        View Details
                      </p>
                      <span>
                        <ChevronRight className="size-3.5 group-hover:text-slate-400" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {filterPopup && (
        <FilterPopup
          position={filterPopup.rect}
          open={filterPopupOpen}
          handleClose={handleCloseFilter}
          handleResetFilter={() => setDraftFilter(defaultFilter)}
          handleApplyFilter={handleApplyFilter}
        >
          <FilterSelect
            id={"Perusahaan"}
            label={"Perusahaan"}
            options={options.perusahaan}
            value={draftFilter.perusahaan}
            handleValueChange={(v) => setField("perusahaan", v)}
            withHr={false}
          />
          <FilterSelect
            id={"Divisi"}
            label={"Divisi"}
            options={options.divisi}
            value={draftFilter.divisi}
            handleValueChange={(v) => setField("divisi", v)}
          />
          <FilterSelect
            id={"Departemen"}
            label={"Departemen"}
            options={options.departemen}
            value={draftFilter.departemen}
            handleValueChange={(v) => setField("departemen", v)}
          />
          <FilterSelect
            id={"Jabatan"}
            label={"Jabatan"}
            options={options.jabatan}
            value={draftFilter.jabatan}
            handleValueChange={(v) => setField("jabatan", v)}
          />
        </FilterPopup>
      )}

      <Modal openModal={open} onClose={close} contentWidth="w-7/8 lg:w-md">
        {mode === "detail" && (
          <ModalPanel
            handleClose={close}
            title={
              <div className="flex flex-col items-center justify-center ">
                {selectedEmployee?.photo ? (
                  <img
                    src={logo}
                    alt="Profile"
                    className="w-12 h-12 object-cover rounded-full outline-1 outline-slate-400 select-none"
                  />
                ) : selectedEmployee?.namalengkap ? (
                  <span className="flex items-center justify-center rounded-full outline-1 outline-slate-400 text-slate-500 font-normal text-lg lg:text-xl shadow-sm bg-slate-200 w-12 h-12 lg:w-15 lg:h-15 mb-1 select-none">
                    {selectedEmployee.namalengkap.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <CircleUserRound
                    strokeWidth={"1.25px"}
                    size={"32px"}
                    color={"#94a3b8"}
                  />
                )}
                <p className="text-lg lg:text-xl">
                  {selectedEmployee?.namalengkap}
                </p>
              </div>
            }
            subtitle={`#${selectedEmployee?.regnum}`}
          >
            <div className="flex w-full mb-1 justify-between gap-2 rounded-xl outline-1 outline-slate-400 shadow-sm py-2 px-1">
              <div className="flex flex-col w-1/3 items-center text-center">
                <p className="text-slate-400 text-xs lg:text-sm font-medium">
                  Jabatan
                </p>
                <p className="font-medium text-sm lg:text-base">
                  {formatCapitalize(selectedEmployee?.jabatan_name)}
                </p>
              </div>
              <div className="flex flex-col w-1/3 items-center text-center">
                <p className="text-slate-400 text-xs lg:text-sm font-medium">
                  Departemen
                </p>
                <p className="font-medium text-sm lg:text-base">
                  {formatCapitalize(selectedEmployee?.departemen_name)}
                </p>
              </div>
              <div className="flex flex-col w-1/3 items-center text-center">
                <p className="text-slate-400 text-xs lg:text-sm font-medium">
                  Divisi
                </p>
                <p className="font-medium text-sm lg:text-base">
                  {formatCapitalize(selectedEmployee?.divisi_name)}
                </p>
              </div>
            </div>
            <div className="flex flex-col w-full text-sm lg:text-base outline-slate-400 p-2">
              <div className="flex w-full justify-between ">
                <p>Perusahaan</p>
                <p>{formatCapitalize(selectedEmployee?.company_name)}</p>
              </div>
              <div className="flex w-full justify-between ">
                <p>Lantai</p>
                <p>{selectedEmployee?.floor_name}</p>
              </div>
              <div className="flex w-full justify-between ">
                <p>Bergabung</p>
                <p>{formatDateIndo(selectedEmployee?.mulai_kerja) || "-"}</p>
              </div>
            </div>
            <hr className="w-full text-slate-400 shadow-sm" />
            {/* <div className="m-2 text-sm flex flex-col w-full">
              <p>{`Joined: ${formatDateIndo(selectedEmployee?.mulai_kerja)}`}</p>
            </div> */}
            <div className="flex flex-col w-full text-sm lg:text-base rounded-xl p-2">
              <div className="flex w-full justify-between ">
                <p>Approver</p>
                <p>{selectedEmployee?.approver_name}</p>
              </div>
              <div className="flex w-full justify-between ">
                <p>Access Role</p>
                <p>{selectedEmployee?.role}</p>
              </div>
            </div>
            <div className="flex mt-4 mb-2">
              <Button
                btnLabel={"Edit"}
                btnColor="outline-1 outline-slate-300 hover:outline-slate-500 hover:text-black/60!"
                textSize="text-base shadow-sm!"
                btnWidth=""
                handleClick={() => {
                  navigate(`/app/m-employee/${selectedEmployee?.regnum}`, {
                    state: { data: selectedEmployee.regnum },
                  });
                }}
              />
            </div>
          </ModalPanel>
        )}
      </Modal>
    </div>
  );
}
