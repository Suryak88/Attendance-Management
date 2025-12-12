import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import { useCategoryStore } from "../../store/useLeaveCategoryStore";
import { useModal } from "../../hooks/useModal";
import {
  LeaveTypeModalContext,
} from "../../context/LeaveTypeContext";
import LeaveTypeModal from "../../components/organisms/Modal/LeaveTypeModal";
import CategoryCard from "../../components/organisms/CategoryCard";

export default function LeaveType() {
  const { user } = useContext(AuthContext);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    category: "",
  });

  const resetForm = useCallback((data) => {
    if (data) {
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
  }, []);

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

  const grouped = useMemo(() => groupByCategory(types), [types]);

  useEffect(() => {
    setCategories(Object.keys(grouped));
  }, [types]);

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
            <LeaveTypeModal
              open={open}
              mode={mode}
              onClose={close}
              form={form}
              setField={setField}
              errorMsg={errorMsg}
              grouped={grouped}
              handleCreate={handleCreate}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
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
