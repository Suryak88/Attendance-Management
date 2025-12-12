import Modal from ".";
import ModalPanel from "./modalPanel";
import FloatingInput from "../../atoms/FloatingInput";
import FloatingSelect from "../../atoms/FloatingSelect/FloatingSelect";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function LeaveTypeModal({
  open,
  mode,
  onClose,
  form,
  setField,
  errorMsg,
  grouped,
  handleCreate,
  handleEdit,
  handleDelete,
}) {
  if (mode === "form") {
    return (
      <Modal openModal={open} onClose={onClose}>
        <ModalPanel
          title={"Add Leave Type"}
          onSubmit={handleCreate}
          btnLabel={"Add"}
          handleClose={onClose}
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
    );
  }

  if (mode === "edit") {
    return (
      <Modal openModal={open} onClose={onClose}>
        <ModalPanel
          title={"Edit Leave Type"}
          onSubmit={handleEdit}
          btnLabel={"Submit"}
          handleClose={onClose}
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
    );
  }

  if (mode === "success") {
    return (
      <Modal openModal={open} onClose={onClose}>
        <ModalPanel
          title={"Succesfull!"}
          onSubmit={onClose}
          btnLabel={"OK!"}
          handleClose={onClose}
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
    );
  }

  if (mode === "confirm") {
    return (
      <Modal openModal={open} onClose={onClose}>
        <ModalPanel
          title={`Delete ${form.name}?`}
          onSubmit={handleDelete}
          btnLabel={"OK!"}
          handleClose={onClose}
          mode={mode}
        >
          <button
            className="bg-slate-400 p-3 rounded-xl"
            onClick={onClose}
          >
            No!
          </button>
        </ModalPanel>
      </Modal>
    );
  }

  return null;
}
