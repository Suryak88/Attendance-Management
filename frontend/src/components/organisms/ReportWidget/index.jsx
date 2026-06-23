import { CalendarCheck, Info } from "lucide-react";
import { colorMap } from "../../../utils/reportWidgetColor";

export default function ReportWidget({
  title,
  iconName,
  dataHead,
  dataAll,
  unit,
  color,
  loading,
  info,
  popupInfo,
  Icon,
}) {
  const colors = colorMap[color] || colorMap.slate;

  return (
    <div
      className={`flex flex-col p-2 outline-1 ${colors.outline} ${colors.bg} rounded-xl shadow-sm`}
    >
      {loading ? (
        <div className="text-transparent">
          <div className="flex gap-2 justify-between">
            <p
              className={`skeleton ${colors.iconBg} px-1 rounded-xl text-sm lg:text-base 2xl:text-lg font-normal`}
            >
              Loading
            </p>
            <span
              className={`skeleton rounded-full p-1 ${colors.iconBg} select-none`}
            >
              <Icon className="size-5" />
            </span>
          </div>
          <div className="flex gap-1 -mt-1 items-end justify-center">
            <p className={`text-2xl -mt-1 lg:mt-0 font-semibold`}>.</p>
            <p
              className={`skeleton font-medium text-sm ${colors.iconBg} rounded-xl`}
            >
              Loading
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 justify-between text-slate-700">
            <p className="text-sm lg:text-base 2xl:text-lg font-normal text-nowrap">
              {title}
            </p>
            {/* <span
              className={`material-symbols-outlined rounded-full p-0.5 ${colors.iconBg} ${colors.text} select-none`}
              style={{
                fontVariationSettings:
                  "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
              }}
            >
              {iconName}
            </span> */}
            {Icon && (
              <span
                className={`rounded-full p-1 ${colors.iconBg} ${colors.text} select-none`}
              >
                <Icon className="size-5" />
              </span>
            )}
          </div>
          <div className="flex gap-1 -mt-1 items-end justify-center text-slate-600">
            <p className="text-lg md:text-2xl -mt-1 lg:mt-0 font-semibold text-slate-600 text-nowrap">
              {dataHead}
            </p>
            {dataAll && (
              <p className="font-medium text-sm text-nowrap">/{dataAll}</p>
            )}
            <p className="font-medium text-sm">{unit}</p>
            {info && (
              <div className="flex self-end">
                {/* <span
                  className={`material-symbols-outlined text-lg! rounded-full p-0.5 leading-none transition duration-300 ease-in-out ${popupInfo ? "bg-emerald-200" : ""} select-none cursor-pointer hover:text-black/50 transition duration-300 ease-in-out`}
                  onClick={info}
                >
                  info
                </span> */}
                <span
                  className={`text-lg! rounded-full p-0.5 leading-none transition duration-300 ease-in-out ${popupInfo ? "bg-emerald-200" : ""} select-none cursor-pointer hover:text-black/50 transition duration-300 ease-in-out`}
                  onClick={info}
                >
                  <Info className="size-4" />
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
