import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import Arrow from "../../components/atoms/Arrow";
import Modal from "../../components/organisms/Modal";
import { useCategoryStore } from "../../store/useLeaveCategoryStore";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FloatingInput from "../../components/atoms/FloatingInput";
import FloatingSelect from "../../components/atoms/FloatingSelect/FloatingSelect";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useModal } from "../../hooks/useModal";
import {
  LeaveTypeModalContext,
  useLeaveModal,
} from "../../context/LeaveTypeContext";

export default function LeaveType() {
  const { user } = useContext(AuthContext);
  const [types, setTypes] = useState([]);
  // const [name, setName] = useState("");
  // const [category, setCategory] = useState("");
  const [form, setForm] = useState({
    id: null,
    name: "",
    category: "",
  });
  const modal = useModal(resetForm);
  const { open, mode, openModal, close, showSuccess } = modal;
  const setCategories = useCategoryStore((s) => s.setCategories);
  const [errorMsg, setErrorMsg] = useState("");

  async function fetchLeaveTypes() {
    try {
      const res = await api.get("/leaveType/LT");
      setTypes(res.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (!user) return;
    fetchLeaveTypes();
  }, [user]);

  const grouped = groupByCategory(types); //  2 KELOMPOK DATA BERDASARKAN KATEGORI

  useEffect(() => {
    setCategories(Object.keys(grouped));
  }, [types]);

  function resetForm(data) {
    if (data) {
      // setName(data.nama);
      // setCategory(data.kategori);
      setForm((prev) => ({
        ...prev,
        id: data.id,
        name: data.nama,
        category: data.kategori,
      }));
      setErrorMsg("");
    } else {
      setTimeout(() => {
        setForm({ id: null, name: "", category: "" });
        setErrorMsg("");
      }, 300);
    }
  }

  // async function handleSubmit(e) {
  //   e.preventDefault();

  //   try {
  //     if (mode === "edit") {
  //       await api.put(`/leaveType/${form.id}`, {
  //         name: form.name,
  //         category: form.category,
  //       });
  //     } else if (mode === "form") {
  //       await api.post("/leaveType/", {
  //         name: form.name,
  //         category: form.category,
  //       });
  //     } else if (mode === "confirm") {
  //       await api.delete(`/leaveType/${form.id}`);
  //     }

  //     fetchLeaveTypes();
  //     showSuccess(7300);
  //   } catch (error) {
  //     if (error.response?.status === 409) {
  //       setErrorMsg("Leave type already exists!");
  //       return;
  //     }
  //     console.error(error);
  //   }
  // }

  function handleCreate(e) {
    e.preventDefault();
    execute(submitCreate);
  }

  function handleEdit(e) {
    e.preventDefault();
    execute(submitEdit);
  }

  function handleDelete(e) {
    e.preventDefault();
    execute(submitDelete);
  }

  async function submitCreate() {
    return api.post("/leaveType/", {
      name: form.name,
      category: form.category,
    });
  }

  async function submitEdit() {
    return api.put(`/leaveType/${form.id}`, {
      name: form.name,
      category: form.category,
    });
  }

  async function submitDelete() {
    return api.delete(`/leaveType/${form.id}`);
  }

  async function execute(action) {
    try {
      await action();
      fetchLeaveTypes();
      showSuccess(7300);
    } catch (error) {
      if (error.response?.status === 409) {
        setErrorMsg("Leave type already exists!");
        return;
      }
      console.error(error);
    }
  }

  function setField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <>
      <LeaveTypeModalContext.Provider value={modal}>
        <div className="flex flex-col flex-1 bg-slate-100 p-4 md:p-6">
          <div className="flex justify-between mb-6">
            <h3 className="text-2xl font-semibold text-slate-800">
              Leave Type
            </h3>
            <button
              className="bg-slate-50 rounded-lg shadow-sm border border-slate-200 px-3 pt-1 hover:shadow-md cursor-pointer"
              onClick={openModal}
            >
              <span className="material-symbols-outlined align-middle leading-none pr-1 text-2xl! pb-1">
                add
              </span>
              Add
            </button>
            {mode === "form" && (
              <Modal openModal={open} onClose={close}>
                <ModalPanel
                  title={"Add Leave Type"}
                  onSubmit={handleCreate}
                  btnLabel={"Add"}
                  handleClose={close}
                  mode={mode}
                >
                  <p
                    className={`animate-bounce transition duration-300 ease-in-out text-base font-semibold text-red-500 text-center mb-2 ${
                      errorMsg ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {errorMsg}
                  </p>
                  <FloatingInput
                    id="Name"
                    value={form.name}
                    onValueChange={(v) => setField("name", v)}
                  />
                  <FloatingSelect
                    id="Category"
                    value={form.category}
                    onValueChange={(v) => setField("category", v)}
                    options={Object.keys(grouped)}
                  />
                </ModalPanel>
              </Modal>
            )}
            {mode === "edit" && (
              <Modal openModal={open} onClose={close}>
                <ModalPanel
                  title={"Edit Leave Type"}
                  onSubmit={handleEdit}
                  btnLabel={"Submit"}
                  handleClose={close}
                  mode={mode}
                >
                  <p
                    className={`animate-bounce transition duration-300 ease-in-out text-base font-semibold text-red-500 text-center mb-2 ${
                      errorMsg ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {errorMsg}
                  </p>
                  <FloatingInput
                    id="Name"
                    value={form.name}
                    onValueChange={(v) => setField("name", v)}
                  />
                  <FloatingSelect
                    id="Category"
                    value={form.category}
                    onValueChange={(v) => setField("category", v)}
                    options={Object.keys(grouped)}
                  />
                </ModalPanel>
              </Modal>
            )}
            {mode === "success" && (
              <Modal openModal={open} onClose={close}>
                <ModalPanel
                  title={"Succesfull!"}
                  onSubmit={close}
                  btnLabel={"OK!"}
                  handleClose={close}
                  mode={mode}
                >
                  <div className="overflow-clip max-w-sm flex justify-center items-center w-fit h-fit mx-auto">
                    <DotLottieReact
                      src="/animation/Checkmark.lottie"
                      autoplay
                      loop
                      className="origin-center scale-150"
                    />
                  </div>
                </ModalPanel>
              </Modal>
            )}
            {mode === "confirm" && (
              <Modal openModal={open} onClose={close}>
                <ModalPanel
                  title={`Delete ${form.name}?`}
                  onSubmit={handleDelete}
                  btnLabel={"OK!"}
                  handleClose={close}
                  mode={mode}
                >
                  <button className="bg-slate-400 p-3 rounded-xl">No!</button>
                </ModalPanel>
              </Modal>
            )}
          </div>

          <div className="columns-1 md:columns-2 gap-6">
            {Object.keys(grouped).map((cat) => (
              <div key={cat} className="break-inside-avoid mb-6">
                <CategoryCard key={cat} title={cat} items={grouped[cat]} />
              </div>
            ))}
          </div>
        </div>
      </LeaveTypeModalContext.Provider>
    </>
  );
}

function groupByCategory(data) {
  return data.reduce((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});
}

function CategoryCard({ title, items }) {
  const [arrowOpen, setArrowOpen] = useState(false);
  return (
    <div
      className={`
      bg-white rounded-xl shadow-sm border border-slate-200 
      px-5 py-3 flex flex-col space-y-2
      hover:shadow-md transition duration-200 ease-in-out
    `}
    >
      <div
        className="flex justify-between mb-3"
        onClick={() => setArrowOpen(!arrowOpen)}
      >
        <h4 className="text-lg font-semibold text-slate-700">{title}</h4>
        <Arrow
          arrowOpen={arrowOpen}
          handleClick={() => setArrowOpen(!arrowOpen)}
        />
      </div>
      <div
        className={`flex flex-wrap gap-2 transition-all duration-300 ease-in-out overflow-auto ${
          arrowOpen
            ? "max-h-40 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-1"
        }`}
      >
        {items.map((item, idx) => (
          <LeaveChip
            key={item.id}
            label={item.nama}
            expand={arrowOpen}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}

// function LeaveChip({ label, item }) {
//   const { editModal, deleteModal } = useLeaveModal();
//   const [showAction, setShowAction] = useState(false);
//   const [canHover, setCanHover] = useState();
//   // const canHover = window.matchMedia("(hover: hover)").matches;

//   useEffect(() => {
//     const mql = window.matchMedia("(hover: hover)");
//     const update = () => setCanHover(mql.matches);
//     update();
//     mql.addEventListener("change", update);
//     return () => mql.removeEventListener("change", update);
//   }, []);

//   const toggleAction = (e) => {
//     e.stopPropagation();

//     // Jika device bisa hover → jangan pakai mode click
//     if (canHover) return;

//     // Jika tidak bisa hover → pakai mobile mode
//     setShowAction((prev) => !prev);
//   };

//   useEffect(() => {
//     if (!showAction) return;
//     if (canHover) return;

//     const close = () => setShowAction(false);
//     document.addEventListener("click", close);

//     return () => document.removeEventListener("click", close);
//   }, [showAction]);

//   return (
//     <>
//       <span
//         className={`
//         px-3 py-1.5 bg-[oklch(92%_0.015_254)]
//         text-slate-700 text-sm font-medium
//         rounded-full border border-slate-300
//         hover:bg-[oklch(89%_0.017_254)] hover:text-slate-900
//         transition-all duration-300 ease-in-out group relative
//       `}
//         onClick={toggleAction}
//       >
//         {/* {label} */}
//         {!showAction && <span>{label}</span>}
//         <div
//           title={`Edit ${label}`}
//           className={`flex opacity-0 group-hover:bg-slate-300 group-hover:opacity-100 absolute w-1/2 h-full rounded-l-full top-0 left-0 items-center justify-center hover:text-blue-600 hover:bg-slate-200 transition-all duration-300 ${
//             showAction
//               ? "opacity-100 bg-slate-100 text-blue-600 border-r border-r-slate-300"
//               : "opacity-0"
//           }`}
//           onClick={(e) => {
//             e.stopPropagation();
//             editModal(item);
//           }}
//         >
//           <span className="material-symbols-outlined select-none">edit</span>
//         </div>
//         <div
//           title={`Delete ${label}`}
//           className={`flex opacity-0 group-hover:bg-slate-300 group-hover:opacity-100 absolute w-1/2 h-full rounded-r-full top-0 right-0 items-center justify-center hover:text-red-500 hover:bg-slate-200 transition-all duration-300 ${
//             showAction ? "opacity-100 bg-slate-100 text-red-500" : " opacity-0"
//           }`}
//           onClick={(e) => {
//             e.stopPropagation();
//             deleteModal(item);
//           }}
//         >
//           <span className="material-symbols-outlined select-none">delete</span>
//         </div>
//       </span>
//     </>
//   );
// }

// old ver
function LeaveChip({ label, item }) {
  const { editModal, deleteModal } = useLeaveModal();
  const [showAction, setShowAction] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover)");
    const update = () => setCanHover(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  function toggleAction(e) {
    if (canHover) return;
    e.stopPropagation();

    setShowAction((prev) => !prev);
  }

  useEffect(() => {
    if (!showAction || canHover) return;

    const close = () => setShowAction(false);
    document.addEventListener("click", close);

    return () => document.removeEventListener("click", close);
  }, [showAction, canHover]);

  return (
    <>
      <span
        onClick={toggleAction}
        className={`
        px-3 py-1.5 bg-[oklch(92%_0.015_254)]
        text-slate-700 text-sm font-medium
        rounded-full border border-slate-300
        hover:bg-[oklch(89%_0.017_254)] hover:text-slate-900
        transition-all duration-300 ease-in-out group relative
      `}
      >
        {label}

        <div
          title={`Edit ${label}`}
          className={`absolute w-1/2 h-full rounded-l-full top-0 left-0 flex items-center justify-center hover:text-blue-600 hover:bg-slate-200 transition-all duration-300 pointer-events-auto cursor-pointer group-hover:bg-slate-300 group-hover:opacity-100 opacity-0     ${
            canHover
              ? "group-hover:bg-slate-200 group-hover:opacity-100 opacity-0 pointer-events-auto"
              : showAction
              ? "bg-slate-100 opacity-100 text-blue-600 border-r border-slate-300 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            editModal(item);
          }}
        >
          <span className="material-symbols-outlined select-none">edit</span>
        </div>

        <div
          title={`Delete ${label}`}
          className={`opacity-0  absolute w-1/2 h-full rounded-r-full top-0 right-0 flex items-center justify-center hover:text-red-500 hover:bg-slate-200 transition-all duration-300 ${
            canHover
              ? "group-hover:bg-slate-300 group-hover:opacity-100 opacity-0 pointer-events-auto"
              : showAction
              ? "bg-slate-200 opacity-100 text-red-500 pointer-events-auto"
              : "group-hover:bg-slate-300 group-hover:opacity-100 pointer-events-none"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            deleteModal(item);
          }}
        >
          <span className="material-symbols-outlined select-none">delete</span>
        </div>
      </span>
    </>
  );
}
