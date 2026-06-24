import { minuteConvert } from "./date.js";

export function buildLatePenalty(logs, rules) {
  const employees = new Map();

  for (const log of logs) {
    if (log.is_workday === 0 || log.has_leave === 1) continue;

    let penalty = 0;
    const violations = [];

    if (log.telat > 0 && log.late_excused !== 1) {
      const lateRule = rules.find(
        (r) =>
          r.penalty_type === "LATE" &&
          log.telat >= r.min_minutes &&
          (r.max_minutes === null || log.telat <= r.max_minutes),
      );

      if (lateRule) {
        penalty += Number(lateRule.penalty_amount);
        violations.push(`Late (${minuteConvert(log.telat)})`);
      }
    }

    if (log.masuk === null) {
      const rule = rules.find((r) => r.penalty_type === "MISSING_IN");

      if (rule) {
        penalty += Number(rule.penalty_amount);
        violations.push(`No Clock-in`);
      }
    }

    if (log.pulang === null) {
      const rule = rules.find((r) => r.penalty_type === "MISSING_OUT");

      if (rule) {
        penalty += Number(rule.penalty_amount);
        violations.push(`No Clock-out`);
      }
    }

    if (penalty === 0) continue;

    if (!employees.has(log.regnum)) {
      employees.set(log.regnum, {
        regnum: log.regnum,
        fullname: log.fullname,
        total_late_minutes: 0,
        total_penalty: 0,
        details: [],
      });
    }

    const employee = employees.get(log.regnum);
    employee.total_late_minutes += log.telat || 0;
    employee.total_penalty += penalty;

    employee.details.push({
      date: log.asattenddate_rev,
      violation: violations.join(", "),
      penalty,
      late_minutes: log.telat,
    });
  }

  const summary = [...employees.values()];

  summary.sort((a, b) =>
    a.fullname.localeCompare(b.fullname, "id", {
      sensitivity: "base",
    }),
  );

  //   sort dari denda terbesar
  //   summary.sort((a, b) => b.total_penalty - a.total_penalty);

  return { summary };
}
