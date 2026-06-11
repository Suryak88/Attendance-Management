import Button from "../../atoms/Button";
import PopUpMenu from "../PopUpMenu";
import { quickFilterAttendanceLog } from "../../../data/quickFIlterAttendanceLog";

export default function FilterPopup({
  position,
  open,
  handleClose,
  children,
  handleResetFilter,
  handleApplyFilter,
  quickFilter = false,
  handleClickQuickFilter,
  activeQuickFilter,
}) {
  return (
    <PopUpMenu
      position={position}
      open={open}
      onClose={handleClose}
      popupWidth="w-50 md:w-55 lg:w-70"
    >
      <div className="flex flex-col gap-2 p-3">
        {quickFilter && (
          <>
            <h3 className="text-sm text-slate-700 font-medium text-center">
              Quick Filter
            </h3>
            <hr className="text-slate-500 shadow-md" />
            <div className="flex flex-wrap gap-2 items-center justify-center mb-3">
              {quickFilterAttendanceLog.map((t, index) => (
                <div
                  key={index}
                  className={`flex flex-wrap rounded-xl px-2 py-1 text-xs lg:text-sm w-fit cursor-pointer outline-1 outline-slate-300 shadow-sm hover:bg-slate-300 ${activeQuickFilter === t.id ? "bg-slate-300 outline-slate-500" : "bg-slate-200"}`}
                  onClick={() => {
                    handleClickQuickFilter(t);
                  }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="text-sm text-slate-700 font-medium text-center">
          Filter
        </h3>
        <hr className="text-slate-500 shadow-md" />
        {children}
        <div className="flex gap-1">
          <Button
            btnLabel={"Reset"}
            btnColor="hover:text-slate-400 active:text-slate-300"
            btnWidth="w-18 px-1!"
            textSize="text-sm shadow-none!"
            handleClick={handleResetFilter}
          />
          <Button
            btnLabel={"Apply"}
            btnColor="bg-slate-200 hover:bg-slate-400 outline-1 outline-slate-300 active:text-white/50"
            btnWidth="w-18 px-1!"
            textSize="text-sm shadow-sm!"
            handleClick={handleApplyFilter}
          />
        </div>
      </div>
    </PopUpMenu>
  );
}
