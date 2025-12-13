import { useState, useEffect, memo } from "react";
import { useLeaveModal } from "../../context/LeaveTypeContext";

const LeaveChip = ({ item, isActive, setActiveChipId, canHover }) => {
  const { editModal, deleteModal } = useLeaveModal();

  function toggleAction(e) {
    if (canHover) return;
    e.stopPropagation();

    setActiveChipId(isActive ? null : item.id);
  }

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
        {item.nama}

        <div
          title={`Edit ${item.nama}`}
          onClick={(e) => {
            e.stopPropagation();
            editModal(item);
          }}
          className={`absolute w-1/2 h-full rounded-l-full top-0 left-0 flex items-center justify-center hover:text-blue-600 hover:bg-slate-200 transition-all duration-300 pointer-events-auto cursor-pointer group-hover:bg-slate-300 group-hover:opacity-100 opacity-0     ${
            canHover
              ? "group-hover:bg-slate-200 group-hover:opacity-100 opacity-0 pointer-events-auto"
              : isActive
              ? "bg-slate-200 opacity-100 text-blue-600 border-r border-slate-300 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="material-symbols-outlined select-none">edit</span>
        </div>

        <div
          title={`Delete ${item.nama}`}
          className={`opacity-0  absolute w-1/2 h-full rounded-r-full top-0 right-0 flex items-center justify-center hover:text-red-500 hover:bg-slate-200 transition-all duration-300 ${
            canHover
              ? "group-hover:bg-slate-300 group-hover:opacity-100 opacity-0 pointer-events-auto"
              : isActive
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
};

export default memo(LeaveChip);
