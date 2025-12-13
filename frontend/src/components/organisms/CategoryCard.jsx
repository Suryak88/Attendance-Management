import { useState, memo } from "react";
import Arrow from "../atoms/Arrow";
import LeaveChip from "../molecules/LeaveChip";

const CategoryCard = ({
  title,
  items,
  activeChipId,
  setActiveChipId,
  canHover,
}) => {
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
        className="flex justify-between mb-3 cursor-pointer"
        onClick={() => setArrowOpen((p) => !p)}
      >
        <h4 className="text-lg font-semibold text-slate-700">{title}</h4>
        <Arrow arrowOpen={arrowOpen} />
      </div>

      <div
        className={`flex flex-wrap gap-2 transition-all duration-300 ease-in-out overflow-auto ${
          arrowOpen
            ? "max-h-40 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-1"
        }`}
      >
        {items.map((item) => (
          <LeaveChip
            key={item.id}
            item={item}
            isActive={activeChipId === item.id}
            setActiveChipId={setActiveChipId}
            canHover={canHover}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(CategoryCard);
