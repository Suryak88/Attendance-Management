import { useRef, useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import {
  useFloating,
  offset,
  flip,
  shift,
  FloatingPortal,
  useDismiss,
  useInteractions,
  autoUpdate,
} from "@floating-ui/react";
import {
  Calendar,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function FloatingMonth({
  id,
  label,
  message,
  selectedMonth,
  setSelectedMonth,

  displayMonth,
  isExternalError = false,
  border = "border md:border-2",
  fontThickness = "font-semibold",
  inputFontSize = "text-base",
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(null);
  const [touched, setTouched] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(selectedMonth.getFullYear());
  const safeDisplayValue = displayMonth ?? "";
  const currentMonth = new Date().getMonth();
  const isError = isExternalError;

  function handleBlur() {
    setTouched(true);
    setIsActive(false);
  }

  function handleSelect(monthIndex) {
    if (monthIndex === undefined || monthIndex === null) return;

    const newDate = new Date(year, monthIndex, 1);

    setSelectedMonth(newDate);
    setIsCalendarOpen(false);
    setIsActive(false);
  }

  const { refs, floatingStyles, context } = useFloating({
    open: isCalendarOpen,
    onOpenChange: setIsCalendarOpen,
    placement: "bottom-end",
    strategy: "fixed",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context, {
    outsidePress: true,
    escapeKey: true,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  return (
    <div
      ref={refs.setReference}
      {...getReferenceProps()}
      className="relative mb-2 lg:mb-3 w-full transition bg-slate-100"
    >
      <input
        type="text"
        id={id}
        name={id}
        value={safeDisplayValue}
        readOnly
        onBlur={handleBlur}
        onClick={() => {
          setIsCalendarOpen((v) => !v);
          setIsActive(true);
        }}
        onFocus={() => setIsActive(true)}
        className={`peer w-full mx-auto ${inputFontSize} font-semibold ${border} mt-2 rounded-lg bg-transparent py-2 px-2 text-gray-900 placeholder-transparent focus:outline-none transition-all duration-200 ease-in-out ${
          isError
            ? "border-red-500"
            : isActive
              ? "border-blue-600"
              : "border-gray-800"
        }`}
        required
      />

      <button
        type="button"
        onClick={() => {
          setIsCalendarOpen((v) => !v);
          setIsActive(true);
        }}
        onBlur={() => {
          setTouched(true);
          setIsActive(false);
        }}
        className={`peer-focus:text-blue-600 absolute top-7 right-1 -translate-y-1/2 leading-none p-1 rounded-full hover:bg-slate-200 active:bg-slate-300 focus:outline-none focus:text-blue-600 focus:bg-slate-200 transition-all duration-200
          `}
      >
        {/* <span
          className={`material-symbols-outlined text-xl!
        ${isError ? "text-red-500" : "focus:text-blue-600"}`}
        >
          today
        </span> */}
        <span className={`${isError ? "text-red-500" : "focus:text-blue-600"}`}>
          <Calendar className="size-5" />
        </span>
      </button>

      <label
        htmlFor={id}
        className={`absolute left-3 bg-slate-100 px-1 text-md transition-all duration-200 first-letter:uppercase select-none
                     ${
                       safeDisplayValue
                         ? `top-2 -translate-y-1/2 text-sm ${fontThickness} ${
                             isError
                               ? "text-red-500"
                               : isActive
                                 ? "text-blue-600"
                                 : "text-gray-800"
                           }`
                         : `top-7.5 lg:top-7 -translate-y-1/2 ${fontThickness} text-base peer-focus:top-2 peer-focus:-translate-y-1/2 text-gray-400 ${
                             isError
                               ? "peer-focus:text-red-500"
                               : isActive
                                 ? "peer-focus:text-blue-600"
                                 : ""
                           }  peer-focus:text-sm`
                     }`}
      >
        {label}
      </label>
      <p
        className={`${
          isError ? "opacity-100" : "opacity-0"
        } text-sm font-normal first-letter:uppercase text-red-500 transition-all duration-300 ease-in-out`}
      >
        {message}
      </p>

      <FloatingPortal>
        <div
          ref={refs.setFloating}
          {...getFloatingProps()}
          style={floatingStyles}
          className={`ignore-popup-close  z-50 bg-white rounded-xl shadow-lg transition-all duration-300 origin-top-left ease-in-out 
              ${
                isCalendarOpen
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
        >
          <div className="bg-white shadow-lg rounded-xl p-4 w-82">
            <div className="flex justify-between mb-4">
              {/* <span
                className="material-symbols-outlined text-3xl! leading-none align-middle 
                hover:bg-red-200 rounded-full transition-all duration-200 cursor-pointer select-none"
                style={{
                  fontVariationSettings:
                    "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
                onClick={() => setYear((y) => y - 1)}
              >
                chevron_backward
              </span> */}
              <div
                className="flex items-center p-1 hover:bg-red-200 rounded-full transition-all duration-200 cursor-pointer select-none"
                onClick={() => setYear((y) => y - 1)}
              >
                <ChevronLeft className="size-6" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-xl">{year}</span>
              {/* <span
                className="material-symbols-outlined text-3xl! leading-none align-middle hover:bg-red-200 rounded-full transition-all duration-200 cursor-pointer select-none"
                style={{
                  fontVariationSettings:
                    "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
                onClick={() => setYear((y) => y + 1)}
              >
                chevron_forward
              </span> */}
              <span
                className="flex items-center p-1 hover:bg-red-200 rounded-full transition-all duration-200 cursor-pointer select-none"
                onClick={() => setYear((y) => y + 1)}
              >
                <ChevronRight className="size-6" strokeWidth={2.5} />
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {months.map((m, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`p-2 rounded-lg hover:bg-red-400 hover:text-white outline-red-400 ${currentMonth === i ? "outline-1" : ""} ${selectedMonth.getMonth() === i ? "bg-red-400 text-white" : ""}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FloatingPortal>
    </div>
  );
}
