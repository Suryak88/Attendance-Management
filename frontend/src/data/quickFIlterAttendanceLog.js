export const quickFilterAttendanceLog = [
  {
    id: 1,
    label: "Today Late",
    getFilter: () => ({
      startDate: new Date(),
      endDate: new Date(),
      employee: "all",
      status: "2",
    }),
  },
  {
    id: 2,
    label: "Today Leave",
    getFilter: () => ({
      startDate: new Date(),
      endDate: new Date(),
      employee: "all",
      status: "1",
    }),
  },
  {
    id: 3,
    label: "This Month Late",
    getFilter: () => ({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth()),
      endDate: new Date(),
      employee: "all",
      status: "2",
    }),
  },
];
