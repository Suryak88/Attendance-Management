export const menu = [
  {
    id: 1,
    name: "Dashboard",
    icon: "dashboard",
    path: "/app/dashboard",
  },
  {
    id: 2,
    name: "Attendance Log",
    icon: "check_in_out",
    path: "/app/attendance-log",
  },
  {
    id: 3,
    name: "Correction",
    icon: "edit_note",
    path: "/app/correction",
  },
  {
    id: 4,
    name: "Master",
    icon: "admin_panel_settings",
    children: [
      {
        id: 41,
        name: "Leave Type",
        icon: "fact_check",
        path: "/app/m-leaveType",
      },
    ],
  },
];
