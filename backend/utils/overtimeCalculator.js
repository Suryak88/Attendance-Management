function roundOvertimeHours(date) {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const mod = minutes % 30;

  if (mod <= 2) {
    d.setMinutes(minutes - mod);
  } else if (mod >= 28) {
    d.setMinutes(minutes + (30 - mod));
  } else {
    d.setMinutes(minutes - mod);
  }

  d.setSeconds(0);
  return d;
}

function calculateRealHours(roundedTime) {
  const start = new Date(roundedTime);
  start.setHours(17, 0, 0, 0);

  const diffMs = roundedTime - start;

  return diffMs / (1000 * 60 * 60);
}

function calculateOvertimeHours(realHours) {
  if (realHours <= 0) return 0;

  let overtime = 0;

  if (realHours >= 1) {
    overtime += 1.5;
    realHours -= 1;
  } else {
    overtime = realHours * 1.5;
    return overtime;
  }

  overtime += realHours * 2;

  return overtime;
}

export { roundOvertimeHours, calculateRealHours, calculateOvertimeHours };
