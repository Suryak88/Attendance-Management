import Modal from ".";
import ModalPanel from "./modalPanel";
import FloatingInput from "../../atoms/FloatingInput";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import FloatingCreatableSelect from "../../atoms/FloatingCreatableSelect";
import FormContent from "./contents/FormContent";
import FormDelete from "./contents/FormDelete";
import FormSuccess from "./contents/FormSuccess";
import Button from "../../atoms/Button";

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
  function getModalTitle(mode, form) {
    switch (mode) {
      case "form":
        return "Add Leave Type";
      case "edit":
        return "Edit Leave Type";
      case "confirm":
        return `Delete ${form.name}?`;
      case "success":
        return "Success!";
      default:
        return "";
    }
  }

  return (
    <Modal openModal={open} onClose={onClose}>
      <ModalPanel title={getModalTitle(mode, form)} handleClose={onClose}>
        {(mode === "form" || mode === "edit") && (
          <FormContent onSubmit={mode === "form" ? handleCreate : handleEdit}>
            <p
              className={`animate-bounce transition duration-300 ease-in-out text-base font-semibold text-red-500 text-center mb-2 ${
                errorMsg ? "opacity-100" : "opacity-0"
              }`}
            >
              {errorMsg}
            </p>
            <div className="md:w-2/3 lg:w-full flex flex-col gap-4 items-center">
              <FloatingInput
                id="Name"
                value={form.name}
                onValueChange={(v) => setField("name", v)}
                border="border-2"
                fontThickness="font-semibold"
              />
              <FloatingCreatableSelect
                id="Category"
                value={form.category}
                onValueChange={(v) => setField("category", v)}
                options={Object.keys(grouped)}
                border="border-2"
                inputFontSize="font-semibold"
              />
              <div className="flex justify-center mt-6 lg:mt-7 mx-auto sm:w-1/3 md:w-full">
                <Button btnLabel={mode === "form" ? "Add" : "Submit"} />
              </div>
            </div>
          </FormContent>
        )}
        {mode === "confirm" && (
          <FormDelete onSubmit={handleDelete} onClose={onClose} />
        )}
        {mode === "success" && (
          <>
            <FormSuccess />
            <Button btnLabel={"OK"} handleClick={onClose} />
          </>
        )}
      </ModalPanel>
    </Modal>
  );
}
