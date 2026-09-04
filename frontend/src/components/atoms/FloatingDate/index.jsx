import { useState, useEffect, useMemo } from "react";
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
import { formatDateFromPicker, formatLocalDate } from "../../../utils/Date";
import { useHolidayCalendar } from "../../../hooks/useHolidayCalendar";
import { useHoliday } from "../../../context/HolidayContext";
import { Calendar } from "lucide-react";

export default function FloatingDate({
  id,
  label,
  message,
  selectedDate,
  setSelectedDate,
  displayValue,
  setDisplayValue,
  isExternalError = false,
  border = "border md:border-2",
  borderColorDefault = "border-black",
  fontThickness = "font-semibold",
  inputFontSize = "text-base",
  dropdown,
  isRequired = true,
  isDisabled = false,
}) {
  // const [displayValue, setDisplayValue] = useState("");
  // const [selectedDate, setSelectedDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(null);
  const [touched, setTouched] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const safeDisplayValue = displayValue ?? "";
  const holidayDates = useHolidayCalendar(calendarMonth);
  const { holidaySet } = useHoliday();
  const modifiers = useMemo(
    () => ({
      sunday: (date) => date.getDay() === 0,
      holiday: (date) => holidaySet.has(formatLocalDate(date)),
    }),
    [holidaySet],
  );
  const modifiersClassNames = useMemo(
    () => ({
      sunday: "text-red-500",
      holiday: "text-red-500",
    }),
    [],
  );
  const isError =
    isExternalError ||
    (touched && safeDisplayValue.trim() === "") ||
    (touched && parseInt(safeDisplayValue) <= 0);

  // useEffect(() => {
  //   if (!displayValue) return;

  //   const [d, m, y] = displayValue.split("/");
  //   if (!d || !m || !y) return;

  //   setSelectedDate(new Date(y, m - 1, d));
  // }, [displayValue]);

  useEffect(() => {
    if (!isCalendarOpen) return;
    if (!safeDisplayValue) return;

    const [d, m, y] = safeDisplayValue.split("/");
    if (!d || !m || !y) return;
    if (
      selectedDate &&
      selectedDate.getDate() === Number(d) &&
      selectedDate.getMonth() === Number(m) - 1 &&
      selectedDate.getFullYear() === Number(y)
    ) {
      return;
    }

    const derivedMonth = new Date(y, m - 1, 1);

    // Hindari reset kalau bulan sama
    if (
      calendarMonth.getMonth() !== derivedMonth.getMonth() ||
      calendarMonth.getFullYear() !== derivedMonth.getFullYear()
    ) {
      setCalendarMonth(derivedMonth);
      setSelectedDate(new Date(y, m - 1, d));
    }
  }, [safeDisplayValue]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    if (safeDisplayValue) {
      const [d, m, y] = safeDisplayValue.split("/");
      if (d && m && y) {
        setCalendarMonth(new Date(y, m - 1, 1));
        return;
      }
    }

    setCalendarMonth(new Date());
  }, [isCalendarOpen]);

  useEffect(() => {
    if (!selectedDate) return;

    const month = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1,
    );

    setCalendarMonth(month);
  }, [selectedDate]);

  function parseSmartDate(input) {
    // if (input == "") return "";
    // if (parseInt(input) < 1) return input;
    if (!input) return "";
    if (typeof input !== "string") return "";

    const digits = input.replace(/\D/g, "").slice(0, 8);

    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentYear = String(now.getFullYear());

    let day = "01";
    let month = currentMonth;
    let year = currentYear;

    // DAY
    if (digits.length >= 1) {
      day = digits.slice(0, 2).padStart(2, "0");
    }

    // MONTH
    if (digits.length >= 3) {
      month = digits.slice(2, 4).padStart(2, "0");
    }

    // YEAR
    if (digits.length >= 5) {
      const yearPart = digits.slice(4);

      if (yearPart.length <= 2) {
        year = `20${yearPart.padStart(2, "0")}`;
      } else {
        year = yearPart.padStart(4, "0");
      }
    }

    const normalized = normalizeDateParts(day, month, year);
    return `${normalized.day}/${normalized.month}/${normalized.year}`;
  }

  function normalizeDateParts(day, month, year) {
    let d = Number(day);
    let m = Number(month);
    let y = Number(year);

    // MONTH max 12
    if (m < 1) m = 1;
    if (m > 12) m = 12;

    // max day per month
    const maxDay = new Date(y, m, 0).getDate();
    if (d < 1) d = 1;
    if (d > maxDay) d = maxDay;

    return {
      day: String(d).padStart(2, "0"),
      month: String(m).padStart(2, "0"),
      year: String(y),
    };
  }

  function handleBlur() {
    setTouched(true);
    const formatted = parseSmartDate(safeDisplayValue);
    setDisplayValue(formatted);
    const [d, m, y] = formatted.split("/");
    if (d && m && y) {
      setSelectedDate(new Date(y, m - 1, d));
    } else {
      setSelectedDate(null);
    }
    setIsActive(false);
  }

  function handleChange(e) {
    const value = e.target.value ?? "";
    const numericOnly = value.replace(/\D/g, "");
    setDisplayValue(numericOnly);
  }

  function handleSelect(date) {
    if (!date) return;
    setSelectedDate(date);
    setDisplayValue(formatDateFromPicker(date));
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
    ancestorScroll: true,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  // useEffect(() => {
  //   fetchHoliday();
  // }, [calendarMonth]);

  // async function fetchHoliday() {
  //   const year = calendarMonth.getFullYear();
  //   const month = String(calendarMonth.getMonth() + 1).padStart(2, "0");
  //   await api
  //     .get(`/holiday/${year}-${month}`)
  //     .then((res) => {
  //       const holiday = res.data.map((item) => {
  //         const d = new Date(item.work_date);
  //         return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  //       });
  //       setHolidayDates(holiday);
  //     })
  //     .catch((error) =>
  //       toast.error(
  //         error?.response?.data?.message || "Gagal mengambil data libur",
  //       ),
  //     );
  // }

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
        onChange={handleChange}
        onBlur={handleBlur}
        onClick={() => setIsActive(true)}
        onFocus={() => setIsActive(true)}
        className={`peer w-full mx-auto ${inputFontSize} font-semibold ${border} mt-2 rounded-lg bg-transparent py-2 px-2 text-gray-900 disabled:text-slate-400 placeholder-transparent focus:outline-none transition-all duration-200 ease-in-out disabled:border-slate-400 ${
          isError
            ? "border-red-500 disabled:border-slate-400"
            : isActive
              ? "border-blue-600 disabled:border-slate-400"
              : `${borderColorDefault}`
        }`}
        required={isRequired}
        autoComplete="off"
        disabled={isDisabled}
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
          disabled:text-slate-400 disabled:active:bg-transparent`}
        disabled={isDisabled}
      >
        <span className={`${isError ? "text-red-500" : "focus:text-blue-600"}`}>
          <Calendar className="size-4.5" />
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
          className={`ignore-popup-close z-50 bg-white rounded-xl shadow-lg transition-all duration-300 origin-top-left ease-in-out 
              ${
                isCalendarOpen
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
        >
          <DayPicker
            mode="single"
            animate
            selected={selectedDate}
            onSelect={handleSelect}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            className="p-3"
            classNames={{
              selected: "bg-red-400 text-white hover:bg-red-500 rounded-full",
              day: "m-1 hover:bg-red-400 hover:text-white rounded-full",
              today: "outline outline-red-400 rounded-full",
            }}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            onDayClick={() => {
              setIsCalendarOpen(false);
              setIsActive(false);
            }}
            captionLayout={dropdown}
          />
        </div>
      </FloatingPortal>
    </div>
  );
}
