import {
  CalendarCheck,
  CalendarCog,
  CalendarX,
  ChevronDown,
  ClockPlus,
  LayoutDashboard,
} from "lucide-react";
import { MENU_ICONS } from "../../../data/menuIcons";

export default function SidebarButton({
  id,
  name,
  icon,
  active,
  handleClick,
  type = "single",
  arrowOpen = false,
  outlineDefault = "",
}) {
  const Icon = MENU_ICONS[icon];
  return (
    <button
      className={`w-full py-2 rounded-xl text-slate-800 font-sans font-medium text-left hover:bg-[oklch(90.8%_0.01615_254.593)] ${outlineDefault}
      transition-all duration-300 ease-in-out
      focus:outline-none focus:ring-1 focus:ring-slate-400 focus:text-red-900 flex cursor-pointer overflow-hidden
      ${active ? "bg-slate-200 text-black" : ""} 
      ${["parent"].includes(type) ? "" : "my-1"} 
      px-2
      lg:px-1
      xl:px-3`}
      key={id}
      onClick={handleClick}
    >
      {/* <span
        className="material-symbols-outlined align-middle leading-none select-none
      pr-2 text-[19px]!
      lg:px-1.5 lg:text-xl!
      xl:pr-3 xl:text-[24px]!"
        style={{
          fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
        }}
      >
        {icon}
      </span> */}
      <div
        className={`select-none
          pr-2 text-[19px]!
          lg:px-1.5 lg:text-xl!
          xl:pr-3 xl:text-[24px]!`}
      >
        {Icon && (
          <Icon
            strokeWidth={"1.5px"}
            className="size-4.5 lg:size-5 xl:size-6"
          />
        )}
      </div>
      <div className="text-sm xl:text-base grow lg:pr-1.5">{name}</div>
      {type === "parent" && (
        <>
          {/* <span
            className={`material-symbols-outlined leading-none transition-transform ease-in-out duration-500
           lg:text-xl! xl:text-[24px]! ${
             arrowOpen ? "rotate-180 " : "rotate-0"
           }`}
          >
            keyboard_arrow_down
          </span> */}
          <span
            className={`leading-none transition-transform ease-in-out duration-500
           lg:text-xl! xl:text-[24px]! ${
             arrowOpen ? "rotate-180 " : "rotate-0"
           }`}
          >
            <ChevronDown className="size-5.5" />
          </span>
        </>
      )}
    </button>
  );
}
