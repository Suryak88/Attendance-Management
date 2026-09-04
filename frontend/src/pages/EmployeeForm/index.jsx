import { Plus } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import Modal from "../../components/organisms/Modal";
import ModalPanel from "../../components/organisms/Modal/modalPanel";
import FloatingInput from "../../components/atoms/FloatingInput";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import FloatingDate from "../../components/atoms/FloatingDate";
import FloatingSelect from "../../components/atoms/FloatingSelect";
import CheckBox from "../../components/atoms/CheckBox";
import Button from "../../components/atoms/Button";
import api from "../../utils/axiosInstance";
import { formatDateFromPicker, formatLocalDate } from "../../utils/Date";
import { toast } from "sonner";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import BtnLoading from "../../components/atoms/BtnLoading";

export default function EmployeeForm() {
  const { user } = useContext(AuthContext);
  const { state } = useLocation();
  const { regnum } = useParams();
  const isEdit = !!regnum;
  const { open, openWithMode, mode, close, showSuccess } = useModal(resetForm);
  const [form, setForm] = useState({
    nama: "",
    nik: "",
    tempatLahir: "",
    tanggalLahir: "",
    regnum: "",
    perusahaan: "",
    divisi: null,
    departemen: null,
    jabatan: null,
    lantai: null,
    approver: "",
    mulaiKerja: "",
    mulaiCuti: "",
    overtimeEnabled: 0,
    idCuti: null,
  });
  const [formKey, setFormKey] = useState(0);
  const [displayBirthDate, setDisplayBirthDate] = useState("");
  const [displayStartWorkDate, setDisplayStartWorkDate] = useState("");
  const [displayStartLeaveDate, setDisplayStartLeaveDate] = useState("");
  const [masterData, setMasterData] = useState({
    perusahaan: [],
    divisi: [],
    departemen: [],
    jabatan: [],
    lantai: [],
    approver: [],
  });
  const filteredDepartemen = useMemo(() => {
    if (!form.divisi) return [];

    return masterData.departemen.filter(
      ({ divisi_id }) => divisi_id === form.divisi,
    );
  }, [masterData.departemen, form.divisi]);
  const filteredJabatan = useMemo(() => {
    if (!form.departemen) return [];

    return masterData.jabatan.filter(
      (d) =>
        d.departemen_id === form.departemen ||
        (d.departemen_id === null && d.value > 2),
    );
  }, [masterData.jabatan, form.departemen]);
  const [jangkaCuti, setJangkaCuti] = useState(null);
  const submitLoader = useDelayedLoading();
  const [disableCuti, setDisableCuti] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    initialForm();
  }, [user, formKey]);

  // useEffect(() => {
  //   if (!form.mulaiKerja) return;

  //   const cuti = new Date(form.mulaiKerja);
  //   cuti.setMonth(cuti.getMonth() + jangkaCuti);

  //   updateForm("mulaiCuti", cuti);
  //   setDisplayStartLeaveDate(formatDateFromPicker(cuti));
  // }, [form.mulaiKerja, jangkaCuti]);

  useEffect(() => {
    if (!form.mulaiKerja || !form.mulaiCuti) return;
    const start = new Date(form.mulaiKerja);
    const leave = new Date(form.mulaiCuti);

    const diffMonth =
      (leave.getFullYear() - start.getFullYear()) * 12 +
      (leave.getMonth() - start.getMonth());

    if (diffMonth === 6) {
      setJangkaCuti(6);
    } else if (diffMonth === 12) {
      setJangkaCuti(12);
    } else {
      setJangkaCuti(null);
    }
  }, [form.mulaiKerja, form.mulaiCuti]);

  useEffect(() => {
    if (!isEdit) return;
    fetchEmployeeForEdit(regnum);
    updateForm("regnum", regnum);
  }, [regnum, isEdit]);

  function changeLeaveRange(month) {
    if (!form.mulaiKerja || disableCuti) return;
    setJangkaCuti(month);

    const cuti = new Date(form.mulaiKerja);
    cuti.setMonth(cuti.getMonth() + month);

    updateForm("mulaiCuti", cuti);
    setDisplayStartLeaveDate(formatDateFromPicker(cuti));
  }

  function updateForm(field, value) {
    if (field === "divisi") {
      setForm((prev) => ({
        ...prev,
        divisi: value,
        departemen: null,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  }

  async function initialForm() {
    try {
      const res = await api.get("/employeeForm/");

      if (!state) updateForm("regnum", String(res.data.nextRegnum));
      setMasterData({
        perusahaan: res.data.company.map((c) => ({
          label: c.nama,
          value: c.id,
        })),
        divisi: res.data.divisi.map((d) => ({
          label: d.nama,
          value: d.id,
        })),
        departemen: res.data.departemen.map((d) => ({
          label: d.nama,
          value: d.id,
          divisi_id: d.divisi_id,
        })),
        jabatan: res.data.jabatan.map((j) => ({
          label: j.nama,
          value: j.id,
          departemen_id: j.departemen_id,
        })),
        lantai: res.data.lantai.map((l) => ({
          label: l.floor_name,
          value: l.id,
        })),
        approver: res.data.approver.map((a) => ({
          label: a.namalengkap,
          value: a.regnum,
        })),
      });
    } catch (error) {
      console.error(error);
      toast.error(error || "Failed to fetch data");
    }
  }

  async function fetchEmployeeForEdit(regnum) {
    if (!isEdit) return;
    try {
      setDisableCuti(false);
      const res = await api.get(`/employeeForm/${regnum}`);
      setForm((prev) => ({
        ...prev,
        regnum: res.data.regnum,
        nama: res.data.namalengkap,
        perusahaan: res.data.company_id,
        divisi: res.data.divisi_id,
        departemen: res.data.departemen_id,
        jabatan: res.data.jabatan_id,
        lantai: res.data.floor_id,
        approver: res.data.approver,
        nik: res.data.nik || "",
        tempatLahir: res.data.tempat_lahir || "",
        tanggalLahir: res.data.tanggal_lahir
          ? new Date(res.data.tanggal_lahir)
          : "",
        mulaiKerja: res.data.mulai_kerja ? new Date(res.data.mulai_kerja) : "",
        mulaiCuti: res.data.effective_date
          ? new Date(res.data.effective_date)
          : "",
        idCuti: res.data.id ?? null,
        overtimeEnabled: res.data.is_overtime_enabled,
      }));
      setDisplayBirthDate(
        res.data.tanggal_lahir
          ? formatDateFromPicker(new Date(res.data.tanggal_lahir))
          : "",
      );
      setDisplayStartWorkDate(
        res.data.mulai_kerja
          ? formatDateFromPicker(new Date(res.data.mulai_kerja))
          : "",
      );
      setDisplayStartLeaveDate(
        res.data.effective_date
          ? formatDateFromPicker(new Date(res.data.effective_date))
          : "",
      );
      setDisableCuti(res.data.disableCuti);
    } catch (error) {
      console.error(error);
      toast.error(error || "Failed to fetch employee data");
    }
  }

  function resetForm() {
    setTimeout(() => {
      setForm((prev) => ({
        ...prev,
        nama: "",
        nik: "",
        tempatLahir: "",
        tanggalLahir: "",
        perusahaan: "",
        divisi: null,
        departemen: null,
        jabatan: null,
        lantai: null,
        approver: "",
        mulaiKerja: "",
        mulaiCuti: "",
        overtimeEnabled: 0,
      }));
      setDisplayBirthDate("");
      setDisplayStartLeaveDate("");
      setDisplayStartWorkDate("");
      setJangkaCuti(null);
    }, 300);
    setFormKey((k) => k + 1);
  }

  function validateForm() {
    if (!form.nama.trim()) {
      toast.error("Nama wajib diisi");
      return false;
    }

    if (form.nik.trim()) {
      if (!/^\d{16}$/.test(form.nik.trim())) {
        toast.error("NIK harus terdiri dari 16 digit angka");
        return false;
      }
    }

    if (!form.perusahaan) {
      toast.error("Perusahaan belum dipilih");
      return false;
    }

    if (!form.divisi) {
      toast.error("Divisi belum dipilih");
      return false;
    }

    if (!form.departemen) {
      toast.error("Departemen belum dipilih");
      return false;
    }

    if (!form.jabatan) {
      toast.error("Jabatan belum dipilih");
      return false;
    }

    if (!form.lantai) {
      toast.error("Lantai belum dipilih");
      return false;
    }

    if (!form.approver) {
      toast.error("Atasan sebagai approver belum dipilih");
      return false;
    }

    if (!form.mulaiKerja) {
      toast.error("Tanggal mulai kerja belum dipilih");
      return false;
    }

    return true;
  }

  function getFormPayload(isForce = false) {
    return {
      nama: form.nama.trim(),
      nik: form.nik.trim(),
      tempatLahir: form.tempatLahir.trim(),
      tanggalLahir: form.tanggalLahir
        ? formatLocalDate(form.tanggalLahir)
        : null,
      regnum: form.regnum,
      perusahaan: form.perusahaan,
      divisi: form.divisi,
      departemen: form.departemen,
      jabatan: form.jabatan,
      lantai: form.lantai,
      approver: form.approver,
      mulaiKerja: form.mulaiKerja ? formatLocalDate(form.mulaiKerja) : null,
      mulaiCuti:
        !disableCuti && form.mulaiCuti ? formatLocalDate(form.mulaiCuti) : null,
      overtimeEnabled: form.overtimeEnabled,
      force: isForce,
      idCuti: form.idCuti,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isEdit) {
      if (!validateForm()) return;
      await editEmployee();
      return;
    }

    if (!validateForm()) return;
    if (!form.mulaiCuti) {
      toast.error("Tanggal mulai cuti belum dipilih");
      return;
    }
    await createEmployee();
  }

  async function createEmployee() {
    try {
      submitLoader.startLoading();

      await api.post("/employeeForm/", getFormPayload());

      resetForm();
      toast.success("Data Berhasil Ditambahkan");
    } catch (error) {
      if (error?.response?.data?.code === "REGNUM_HAS_BEEN_USED") {
        const toastId = toast.warning("Regnum sudah digunakan", {
          description: `Lanjutkan dengan regnum baru: ${error?.response?.data?.nextRegnum} ?`,
          duration: Infinity,
          onDismiss: () => submitLoader.stopLoading(),
          action: {
            label: "Lanjutkan",
            onClick: async () => {
              try {
                await api.post("/employeeForm/", getFormPayload(true));
                resetForm();
                toast.success("Data Berhasil Ditambahkan");
              } catch (error) {
                toast.error(
                  error?.response?.data?.message || "Gagal memproses",
                );
              } finally {
                submitLoader.stopLoading();
              }
            },
          },
          cancel: {
            label: "Batal",
            onClick: () => submitLoader.stopLoading(),
          },
        });
      } else {
        toast.error(error?.response?.data?.message || "Failed to Submit");
        submitLoader.stopLoading();
      }
    } finally {
      submitLoader.stopLoading();
    }
  }

  async function editEmployee(e) {
    try {
      submitLoader.startLoading();

      await api.put(`/employeeForm/${form.regnum}`, getFormPayload());
      resetForm();
      toast.success("Data Berhasil Diubah!");
      navigate("/app/m-employee");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to Submit Changes");
    } finally {
      submitLoader.stopLoading();
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-100 p-4">
      <div className="flex justify-between mb-6">
        <h3 className="text-xl md:text-2xl font-semibold text-slate-800">
          {isEdit ? "Edit Employee" : "New Employee"}
        </h3>
      </div>
      <div key={formKey}>
        <div className="flex flex-col relative max-w-md p-2 gap-1 outline-1 outline-slate-400 shadow-sm rounded-lg">
          <p className="font-medium absolute -top-3 right-3 px-1 bg-slate-100 text-slate-500">
            Data Pribadi
          </p>
          <div className="flex flex-col my-1 mx-2">
            <h3 className="text-sm font-medium text-slate-700 ">
              Nama Lengkap
            </h3>
            <FloatingInput
              value={form.nama}
              onValueChange={(v) => updateForm("nama", v)}
            />
          </div>
          <div className="flex flex-col my-1 mx-2">
            <h3 className="text-sm font-medium text-slate-700 ">NIK</h3>
            <FloatingInput
              value={form.nik}
              onValueChange={(v) => updateForm("nik", v)}
              isRequired={false}
            />
          </div>
          <div className="flex my-1 mx-2 gap-2 ">
            <div>
              <h3 className="text-sm font-medium text-slate-700">
                Tempat lahir
              </h3>
              <FloatingInput
                value={form.tempatLahir}
                onValueChange={(v) => updateForm("tempatLahir", v)}
                isRequired={false}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700 z-50 ">
                Tanggal Lahir
              </h3>
              <FloatingDate
                selectedDate={form.tanggalLahir}
                setSelectedDate={(v) => updateForm("tanggalLahir", v)}
                displayValue={displayBirthDate}
                setDisplayValue={setDisplayBirthDate}
                border="border"
                dropdown={"dropdown"}
                isRequired={false}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col relative max-w-md p-2 gap-1 outline-1 my-8 outline-slate-400 shadow-sm rounded-lg">
          <p className="font-medium absolute -top-3 right-3 px-1 bg-slate-100 text-slate-500">
            Data Pekerjaan
          </p>
          <div className="flex justify-between gap-2 my-1 mx-2">
            <div className="w-1/4">
              <h3 className="text-sm font-medium text-slate-700 ">Regnum</h3>
              <FloatingInput
                value={form.regnum}
                onValueChange={(v) => updateForm("regnum", v)}
                isDisabled={true}
              />
            </div>
            <div className="w-3/4">
              <h3 className="text-sm font-medium text-slate-700 ">
                Perusahaan
              </h3>
              <FloatingSelect
                value={form.perusahaan}
                onValueChange={(v) => updateForm("perusahaan", v)}
                options={masterData.perusahaan}
                border="border"
              />
            </div>
          </div>
          <div className="flex justify-between gap-2 my-1 mx-2">
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-slate-700">Divisi</h3>
              <FloatingSelect
                value={form.divisi}
                onValueChange={(v) => updateForm("divisi", v)}
                options={masterData.divisi}
                border="border"
              />
            </div>
            <div className="w-1/2">
              <h3
                className={`transition-all duration-300 text-sm font-medium  ${!form.divisi ? "text-slate-400" : "text-slate-700"}`}
              >
                Departemen
              </h3>
              <FloatingSelect
                value={form.departemen}
                onValueChange={(v) => updateForm("departemen", v)}
                options={filteredDepartemen}
                border="border"
                isDisable={!form.divisi}
              />
            </div>
          </div>
          <div className="flex justify-between gap-2 my-1 mx-2">
            <div className="w-1/2">
              <h3
                className={`transition-all duration-300  text-sm font-medium ${!form.departemen ? "text-slate-400" : "text-slate-700"} `}
              >
                Jabatan
              </h3>
              <FloatingSelect
                value={form.jabatan}
                onValueChange={(v) => updateForm("jabatan", v)}
                options={filteredJabatan}
                border="border"
                isDisable={!form.departemen}
              />
            </div>
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-slate-700">Lantai</h3>
              <FloatingSelect
                value={form.lantai}
                onValueChange={(v) => updateForm("lantai", v)}
                options={masterData.lantai}
                border="border"
              />
            </div>
          </div>
          <div className="flex flex-col my-1 mx-2">
            <h3 className="text-sm font-medium text-slate-700 ">
              Atasan sebagai Approver
            </h3>
            <FloatingSelect
              value={form.approver}
              onValueChange={(v) => updateForm("approver", v)}
              options={masterData.approver}
              border="border"
            />
          </div>
          <div className="flex justify-between gap-2 my-1 mx-2">
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-slate-700 ">
                Tanggal Mulai Kerja
              </h3>
              <FloatingDate
                selectedDate={form.mulaiKerja}
                setSelectedDate={(v) => updateForm("mulaiKerja", v)}
                displayValue={displayStartWorkDate}
                setDisplayValue={setDisplayStartWorkDate}
                border="border"
              />
            </div>
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-slate-700 ">
                Mulai Cuti
              </h3>
              <FloatingDate
                selectedDate={form.mulaiCuti}
                setSelectedDate={(v) => updateForm("mulaiCuti", v)}
                displayValue={displayStartLeaveDate}
                setDisplayValue={setDisplayStartLeaveDate}
                border="border"
                isDisabled={disableCuti}
              />
              <div className="flex items-center justify-around">
                <label
                  className={`flex gap-1 items-center ${disableCuti ? "text-slate-400" : ""}`}
                >
                  <input
                    type="radio"
                    name="leaveRange"
                    checked={jangkaCuti === 6}
                    onChange={() => changeLeaveRange(6)}
                  />
                  <p>6 Bulan</p>
                </label>
                <label
                  className={`flex gap-1 items-center ${disableCuti ? "text-slate-400" : ""}`}
                >
                  <input
                    type="radio"
                    name="leaveRange"
                    checked={jangkaCuti === 12}
                    onChange={() => changeLeaveRange(12)}
                  />
                  <p>12 Bulan</p>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col max-w-md relative p-2 gap-1 outline-1 my-8 outline-slate-400 shadow-sm rounded-lg">
          <p className="font-medium absolute -top-3 right-3 px-1 bg-slate-100 text-slate-500">
            Data Sistem
          </p>
          <div className="flex flex-col gap-2 my-1 text-sm">
            <CheckBox
              id={"overtimeEnabled"}
              label={"Deteksi Otomatis Lembur"}
              isTruncate={false}
              checked={form.overtimeEnabled}
              onClick={() =>
                updateForm("overtimeEnabled", !form.overtimeEnabled)
              }
            />
          </div>
        </div>
        <div className="flex max-w-md justify-around mt-10 mb-5 ">
          {!isEdit && (
            <Button
              btnLabel={"Clear Data"}
              btnColor="outline-1 outline-slate-400 hover:outline-slate-500 hover:text-black/60! disabled:text-black/40"
              btnWidth="w-35 px-1! py-1.5"
              textSize="text-sm shadow-none! font-normal!"
              btnTitle="Uncheck all"
              handleClick={resetForm}
              btndisable={submitLoader.loading}
            />
          )}
          <Button
            btnLabel={submitLoader.loading ? <BtnLoading /> : "Submit Data"}
            btnColor="outline-1  outline-blue-500 bg-blue-200 hover:bg-blue-300 disabled:text-black/40!"
            btnWidth="w-35 px-1! py-1.5"
            textSize="text-sm shadow-none!"
            btnTitle="Submit New Employee"
            handleClick={handleSubmit}
            btndisable={submitLoader.loading}
          />
        </div>
      </div>
    </div>
  );
}
