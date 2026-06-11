export function buildSummary(logs) {
  const result = logs.reduce(
    (acc, l) => {
      const status = l.final_status;

      if (l.is_workday === 1) {
        acc.summary.total_workdays++;

        if (status === "PRESENT") acc.summary.present_days++;
        if (status === "ABSENT") acc.summary.absent_days++;
        if (status === "LEAVE") {
          acc.summary.total_leave_days++;
          acc.summary.leave_breakdown[l.leave_name] =
            (acc.summary.leave_breakdown[l.leave_name] || 0) + 1;
          if (l.leave_name === "Sakit") acc.summary.sick_days++;
          if (l.leave_name === "Cuti Tahunan") acc.summary.leave_days++;
        }
        if (status === "MISSING") acc.summary.missing_days++;
        if (status === "CONFLICT") acc.summary.conflict_days++;

        if (status === "CONFLICT") {
          acc.flags.has_conflict = true;
        }

        if (status === "MISSING") {
          acc.flags.has_missing = true;
        }

        if (status === "ABSENT") {
          acc.flags.has_absent = true;
        }

        if (status !== "LEAVE") {
          acc.summary.total_target_work_minutes +=
            Number(l.min_work_minutes) || 0;
        }
      }

      // hanya hitung metrik kalau valid present
      if (status === "PRESENT" || (l.is_workday === 0 && l.masuk && l.pulang)) {
        const lateMinutes = Number(l.telat) || 0;
        const earlyLeaveMinutes = Number(l.pulang_cepat) || 0;
        const actualWorkTime = Number(l.work_time) || 0;
        const targetWorkTime = Number(l.min_work_minutes) || 0;
        const overtimeMinutes = (Number(l.durasi_lembur) || 0) * 60;

        acc.summary.total_late_minutes += lateMinutes;
        if (l.late_excused === 1) {
          acc.summary.total_late_minutes_excused += lateMinutes;
        } else {
          acc.summary.total_late_minutes_unexcused += lateMinutes;
        }

        acc.summary.total_early_leave_minutes += earlyLeaveMinutes;
        if (l.early_leave_excused === 1) {
          acc.summary.total_early_leave_minutes_excused += earlyLeaveMinutes;
        } else {
          acc.summary.total_early_leave_minutes_unexcused += earlyLeaveMinutes;
        }

        acc.summary.total_actual_work_minutes += Math.max(
          0,
          actualWorkTime - overtimeMinutes,
        );

        acc.summary.total_overtime_hours += Number(l.durasi_lembur) || 0;
        acc.summary.total_overtime_counted_hours +=
          Number(l.durasi_total_lembur) || 0;
      }

      return acc;
    },
    {
      summary: {
        total_workdays: 0,
        total_actual_work_minutes: 0,
        total_target_work_minutes: 0,
        present_days: 0,
        sick_days: 0,
        leave_days: 0,
        leave_breakdown: {},
        total_leave_days: 0,
        absent_days: 0,
        missing_days: 0,
        conflict_days: 0,
        total_late_minutes: 0,
        total_late_minutes_excused: 0,
        total_late_minutes_unexcused: 0,
        total_early_leave_minutes: 0,
        total_early_leave_minutes_excused: 0,
        total_early_leave_minutes_unexcused: 0,
        total_overtime_hours: 0,
        total_overtime_counted_hours: 0,
      },
      flags: {
        has_conflict: false,
        has_missing: false,
        has_absent: false,
      },
    },
  );

  return result;
}
