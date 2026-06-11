export const quickGenerateReport = [
  {
    id: 1,
    label: "All",
    getFilter: (data) => data.map((r) => r.employee.regnum),
  },
  {
    id: 2,
    label: "Complete Data",
    getFilter: (data) =>
      data
        .filter(
          (r) =>
            !r.flags.has_conflict &&
            !r.flags.has_missing &&
            !r.flags.has_absent,
        )
        .map((r) => r.employee.regnum),
  },
  {
    id: 3,
    label: "Needs Attention",
    getFilter: (data) =>
      data
        .filter(
          (r) =>
            r.flags.has_conflict || r.flags.has_missing || r.flags.has_absent,
        )
        .map((r) => r.employee.regnum),
  },
];
