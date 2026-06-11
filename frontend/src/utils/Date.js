// function formatMySQLTime(date) {
//   if (!date) return null;
//   const d = new Date(date);
//   return d.toTimeString().split(" ")[0]; // HH:MM:SS
// }

function formatMySQLTime(mysqlDatetime) {
  if (!mysqlDatetime) return "";
  return mysqlDatetime.slice(11, 19);
}

function isoUtcToMySQLLocal(isoString) {
  if (!isoString) return null;

  const d = new Date(isoString); // UTC

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function isoUTCToTime(isoString) {
  const dateTime = isoUtcToMySQLLocal(isoString);
  return formatMySQLTime(dateTime);
}

function mergeTimeToDate(date, hhmm) {
  if (!date || !hhmm) return null;

  const [h, m] = hhmm.split(":").map(Number);

  // date diasumsikan Date object dari date picker
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const hh = String(h).padStart(2, "0");
  const min = String(m).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;
}

function formatDateIndo(date, withDay = "") {
  if (!date || date === "0000-00-00 00:00:00") return null;
  const d = new Date(date);

  if (isNaN(d.getTime())) return null;

  return d.toLocaleDateString(
    "id-ID",
    withDay
      ? {
          weekday: `${withDay}`,
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      : {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
  );
}

function formatDateRangeIndo(start, end) {
  if (!start || !end) return null;

  const d1 = new Date(start);
  const d2 = new Date(end);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return null;
  }

  if (d1.toDateString() === d2.toDateString()) {
    return formatDateIndo(d1);
  }

  const sameMonth =
    d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const sameYear = d1.getFullYear() === d2.getFullYear();

  const startDay = String(d1.getDate()).padStart(2, "0");

  if (sameMonth) {
    return `${startDay} - ${formatDateIndo(d2)}`;
  }

  if (sameYear) {
    return `${d1.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    })} - ${formatDateIndo(d2)}`;
  }

  return `${formatDateIndo(d1)} - ${formatDateIndo(d2)}`;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateLeaveDaysExcludeSunday(startDate, endDate) {
  if (!startDate || !endDate) return "";

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end < start) return "";

  let days = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const day = cursor.getDay(); // 0 = Sunday
    if (day !== 0) {
      days++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function formatDateFromPicker(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}/${month}/${year}`;
}

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

function minuteConvert(time) {
  const timeHours = Math.floor(time / 60);
  const minutes = time % 60;

  if (timeHours > 0 && minutes > 0) return `${timeHours}h ${minutes}m`;
  if (timeHours > 0 && minutes === 0) return `${timeHours}h`;
  return `${minutes}m`;
}

function parseLocalDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-");
  return new Date(year, month - 1, day);
}

function countWorkingDays(startDate, endDate, holidaySet = new Set()) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end < start) return 0;

  let days = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    // const dateString = cursor.toISOString().split("T")[0];
    const dateString = formatLocalDate(cursor);
    const isHoliday = holidaySet.has(dateString);

    if (!isHoliday) {
      days++;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export {
  formatMySQLTime,
  isoUtcToMySQLLocal,
  isoUTCToTime,
  mergeTimeToDate,
  formatDateIndo,
  formatLocalDate,
  calculateLeaveDaysExcludeSunday,
  formatDateFromPicker,
  parseSmartDate,
  minuteConvert,
  parseLocalDate,
  countWorkingDays,
  formatDateRangeIndo,
};
