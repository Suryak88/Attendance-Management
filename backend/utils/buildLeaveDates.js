export function buildLeaveDates(dayType, workdays, allLeaveDates) {
  if (dayType === "WORKDAY") {
    return workdays.map((w) => new Date(w.work_date ?? w));
  }

  return allLeaveDates.map((d) => new Date(d));
}
