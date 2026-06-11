import { X, Check } from "lucide-react";
import { truncateText } from "../../../utils/truncateText";

export default function CheckBox({
  id,
  label,
  status,
  checked,
  onClick,
  truncateSize,
  truncateDot = true,
  isTruncate = true,
}) {
  function renderIcon() {
    switch (status) {
      case 1:
        return <Check size={36} />;
      case 2:
        return <X />;
      case 4:
        return <X />;
      default:
        if (checked) return <Check />;

        return null;
    }
  }

  function getStyle() {
    switch (status) {
      case 1:
        return "bg-green-200 text-green-700 outline-green-600";
      case 2:
        return "bg-red-200 text-red-700 outline-red-600";
      case 4:
        return "bg-slate-200 text-red-700 outline-red-600";
      default:
        return checked
          ? "bg-sky-200 text-blue-700 outline-blue-600 cursor-pointer"
          : "bg-white outline-slate-600 group-hover:bg-slate-100 cursor-pointer";
    }
  }

  return (
    <div
      onClick={onClick}
      className="flex w-full items-center group justify-start"
    >
      <div
        id={id}
        className={`w-4 h-4 ml-1 mr-2 rounded-sm outline-1 flex items-center justify-center transition-all ${getStyle()}`}
      >
        {renderIcon()}
      </div>
      {isTruncate ? (
        <>
          <span className="group-hover:cursor-pointer text-left xl:hidden">
            {truncateText(label, truncateSize, truncateDot)}
          </span>
          <span className="group-hover:cursor-pointer text-left hidden xl:flex ">
            {truncateText(label)}
          </span>
        </>
      ) : (
        <span className="group-hover:cursor-pointer text-left">{label}</span>
      )}
    </div>
  );
}
