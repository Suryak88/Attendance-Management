import BtnLoading from "../../atoms/BtnLoading";
import Button from "../../atoms/Button";
import FloatingTextArea from "../../atoms/FloatingTextArea";

export default function ActionFormSection({
  appear,
  actionMode,
  notesLabel,
  notesValue,
  setNotesValue,
  noteIsDisable,
  btnLabel,
  loading,
  handleClick,
  handleCancel,
}) {
  return (
    <>
      <div
        className={`w-full space-y-5 mt-5 transition-all duration-500 ease-in-out
                    ${
                      appear
                        ? "opacity-100 translate-y-0 max-h-60 pointer-events-auto"
                        : "opacity-0 -translate-y-8 max-h-0 pointer-events-none"
                    }`}
      >
        <hr className="text-slate-400" />
        <FloatingTextArea
          id={notesLabel}
          value={notesValue}
          onValueChange={setNotesValue}
          message={"Please enter the notes"}
          border="border rounded-xl! shadow-sm"
          borderColorDefault="border-slate-400"
          inputFontThickness="font-normal"
          labelFontThickness="font-normal"
          isDisable={noteIsDisable}
        />
      </div>
      {actionMode !== null && (
        <div className="flex gap-12 mt-5">
          <Button
            btnLabel={"Cancel"}
            handleClick={handleCancel}
            btnColor="bg-slate-300 hover:bg-slate-400 outline-1 outline-slate-600 disabled:text-black/40"
            btnWidth=""
            btndisable={loading}
          />
          <Button
            btnLabel={
              loading ? (
                <div className="px-4 py-0.5">
                  <BtnLoading />
                </div>
              ) : (
                <div>
                  <p>{btnLabel}</p>
                </div>
              )
            }
            btndisable={loading}
            handleClick={handleClick}
            btnColor="bg-red-300 hover:bg-red-400 outline-1 outline-red-600 in-first:capitalize"
            btnWidth=""
          />
        </div>
      )}
    </>
  );
}
