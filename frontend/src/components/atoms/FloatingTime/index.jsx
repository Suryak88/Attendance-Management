import { useState, useRef, useEffect } from "react";
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
import { Clock8 } from "lucide-react";

export default function FloatingTime({
  id,
  label,
  message,
  value,
  onChange,
  displayValue,
  setDisplayValue,
  isExternalError = false,
  border = "border md:border-2",
  fontThickness = "font-semibold",
  isDisable = false,
}) {
  const [touched, setTouched] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const isProgrammaticScroll = useRef(false);
  const isClosingRef = useRef(false);
  const safeDisplayValue = displayValue ?? "";
  const isError =
    (isExternalError ||
      (touched && safeDisplayValue.trim() === "") ||
      (touched && parseInt(safeDisplayValue) <= 0)) &&
    isDisable === false;
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const itemHeight = 28;

  useEffect(() => {
    if (!openPicker) return;
    const initial =
      displayValue && displayValue.includes(":") ? displayValue : "08:30";
    const [h, m] = initial.split(":");

    isProgrammaticScroll.current = true;

    setTimeout(() => {
      if (hourRef.current) {
        hourRef.current.scrollTop = hours.indexOf(h) * itemHeight;
      }

      if (minuteRef.current) {
        minuteRef.current.scrollTop = minutes.indexOf(m) * itemHeight;
      }

      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50);
    }, 0);
  }, [openPicker]);

  function parseSmartTime(input) {
    if (!input) return "";

    const digits = input.replace(/\D/g, "").slice(0, 4);

    let hour = "00";
    let minute = "00";

    if (digits.length <= 2) {
      hour = digits;
    } else {
      hour = digits.slice(0, 2);
      minute = digits.slice(2);
    }

    return normalizeTime(hour, minute);
  }

  function normalizeTime(hour, minute = "0") {
    let h = Number(hour);
    let m = Number(minute.padEnd(2, "0"));

    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;

    h = Math.min(23, Math.max(0, h));
    m = Math.min(59, Math.max(0, m));

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  }

  function handleBlur() {
    if (openPicker || isClosingRef.current) return;

    setTouched(true);
    const formatted = parseSmartTime(displayValue);
    onChange(formatted);
    setDisplayValue(formatted);
    setIsActive(false);
  }

  function handleChange(e) {
    const numericOnly = e.target.value.replace(/\D/g, "");
    setDisplayValue(numericOnly);
  }

  function handleKey(e, ref) {
    const itemHeight = 28;
    const el = ref.current;
    if (!el) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      el.scrollTo({
        top: el.scrollTop + itemHeight,
        behavior: "smooth",
      });
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      el.scrollTo({
        top: el.scrollTop - itemHeight,
        behavior: "smooth",
      });
    }
  }

  function handleWheel(e, ref) {
    e.preventDefault();

    const el = ref.current;
    if (!el) return;

    const direction = e.deltaY > 0 ? 1 : -1;

    el.scrollTo({
      top: el.scrollTop + direction * itemHeight,
      behavior: "auto",
    });
  }

  function closePicker() {
    isClosingRef.current = true;
    setOpenPicker(false);

    setTimeout(() => {
      isClosingRef.current = false;
    }, 300);
  }

  function getCenteredValue(ref, list) {
    const el = ref.current;
    if (!el) return null;

    const index = Math.round(el.scrollTop / itemHeight);
    return list[Math.max(0, Math.min(index, list.length - 1))];
  }

  const { refs, floatingStyles, context } = useFloating({
    open: openPicker,
    // onOpenChange: setOpenPicker,
    onOpenChange: (open) => {
      if (!open) {
        closePicker();
      } else {
        setOpenPicker(true);
      }
    },
    placement: "bottom-end",
    strategy: "fixed",
    middleware: [offset(4), flip(), shift({ padding: 6 })],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context, {
    outsidePress: true,
    escapeKey: true,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  function TimePickerPanel({ value, onChange }) {
    function handleSave() {
      const h = getCenteredValue(hourRef, hours) ?? "08";
      const m = getCenteredValue(minuteRef, minutes) ?? "30";

      const finalValue = normalizeTime(h, m);

      setDisplayValue(finalValue);
      onChange(finalValue);

      closePicker();

      // refs.reference.current?.blur();
      setIsActive(false);
    }

    return (
      <div className="flex flex-col w-36 p-2 rounded-xl bg-white shadow-lg min-h-0">
        <div className="flex justify-center mb-3 font-medium">
          <h6>Select time</h6>
        </div>
        <div className="relative flex mb-3 h-36 min-h-0">
          <div className="absolute pointer-events-none top-1/2 -translate-y-1/2 w-full h-7 flex items-center justify-center border border-slate-200 shadow-xs bg-slate-100/30 rounded-md">
            <p className="hidden"></p>
          </div>

          <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-white via-transparent to-white" />
          <div
            ref={hourRef}
            // onScroll={handleHourScroll}
            onWheel={(e) => handleWheel(e, hourRef)}
            onKeyDown={(e) => handleKey(e, hourRef)}
            tabIndex={0}
            className="relative w-1/2 text-right px-2 text-lg h-full py-14.5 overflow-y-auto overscroll-contain scroll-smooth snap-y snap-mandatory scrollbar-hidden focus:outline-none"
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-7 flex items-center justify-end snap-center"
              >
                {hour}
              </div>
            ))}
          </div>

          <div className="flex items-center">:</div>

          <div
            ref={minuteRef}
            // onScroll={handleMinuteScroll}
            onWheel={(e) => handleWheel(e, minuteRef)}
            onKeyDown={(e) => handleKey(e, minuteRef)}
            tabIndex={0}
            className="relative w-1/2 text-left px-2 text-lg h-full py-14.5 overflow-y-auto overscroll-contain scroll-smooth snap-y snap-mandatory scrollbar-hidden focus:outline-none"
          >
            {minutes.map((minute) => (
              <div
                key={minute}
                className="h-7 flex items-center justify-start snap-center"
              >
                {minute}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-evenly">
          <button
            className="p-2 rounded-lg border border-slate-50 hover:border-slate-200 text-sm cursor-pointer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              closePicker();
            }}
          >
            Cancel
          </button>
          <button
            className="p-2 rounded-lg border border-slate-50 hover:border-slate-200 text-sm cursor-pointer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
          >
            Save{"  "}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={refs.setReference}
      {...getReferenceProps()}
      className="relative w-full transition bg-slate-100"
    >
      <input
        type="text"
        id={id}
        name={id}
        value={safeDisplayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onClick={() => {
          setOpenPicker(false);
          setIsActive(true);
        }}
        onFocus={() => setIsActive(true)}
        disabled={isDisable}
        className={`peer w-full mx-auto text-base font-semibold ${border} mt-2 rounded-lg bg-transparent py-2 px-2 text-gray-900 placeholder-transparent focus:outline-none transition-all duration-200 ease-in-out disabled:text-slate-400 disabled:pointer-events-none disabled:select-none ${
          isError
            ? "border-red-500"
            : isActive
              ? "border-blue-600"
              : "border-gray-800 disabled:border-slate-400"
        }`}
        required
        autoComplete="off"
      />

      <button
        type="button"
        onClick={() => {
          setOpenPicker((v) => !v);
          setIsActive(true);
        }}
        onBlur={() => {
          setTouched(true);
          setIsActive(false);
        }}
        disabled={isDisable}
        className={`peer-focus:text-blue-600 absolute top-7 right-1 -translate-y-1/2 leading-none rounded-full hover:bg-slate-200 active:bg-slate-300 focus:outline-none focus:text-blue-600 focus:bg-slate-200 transition-all duration-200 disabled:pointer-events-none
          `}
      >
        {/* <span
          className={`material-symbols-outlined text-xl! ${
            isDisable ? "text-gray-500" : ""
          }
        ${isError ? "text-red-500" : "focus:text-blue-600 "}`}
        >
          nest_clock_farsight_analog
        </span> */}
        <div
          className={`rounded-full p-1 ${isDisable ? "text-gray-500" : ""}
        ${isError ? "text-red-500" : "focus:text-blue-600 "}`}
        >
          <Clock8 className="size-4.5" />
        </div>
      </button>

      <label
        htmlFor={id}
        className={`absolute left-3 bg-slate-100 px-1 text-md transition-all duration-200 first-letter:uppercase select-none ${
          isDisable ? "text-slate-400" : ""
        }
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
          className={`ignore-popup-close z-50 transition-all duration-300 origin-top-right ease-in-out ${
            openPicker
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <TimePickerPanel value={value} onChange={onChange} />
        </div>
      </FloatingPortal>
    </div>
  );
}
