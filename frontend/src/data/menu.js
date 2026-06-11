export const menu = [
  {
    id: 1,
    name: "Dashboard",
    icon: "dashboard",
    path: "/app/dashboard",
    roles: ["STAFF", "SUPERVISOR", "MANAGER", "ADMIN"],
  },
  {
    id: 2,
    name: "Attendance",
    icon: "check_in_out",
    children: [
      {
        id: 21,
        name: "Log",
        path: "/app/attendance-log",
        roles: ["STAFF", "SUPERVISOR", "MANAGER"],
      },
      {
        id: 22,
        name: "Report",
        path: "/app/attendanceReport",
        roles: ["STAFF", "SUPERVISOR", "MANAGER"],
      },
    ],
    roles: ["STAFF", "SUPERVISOR", "MANAGER"],
  },
  {
    id: 3,
    name: "Leave",
    icon: "event_busy",
    children: [
      {
        id: 31,
        name: "Request",
        path: "/app/leaveRequest",
        roles: ["STAFF", "SUPERVISOR", "MANAGER"],
      },
      {
        id: 32,
        name: "Usage",
        path: "/app/leaveUsage",
        roles: ["STAFF", "SUPERVISOR", "MANAGER"],
      },
      {
        id: 33,
        name: "Approval",
        path: "/app/leaveApproval",
        roles: ["SUPERVISOR", "MANAGER"],
      },
    ],
    roles: ["STAFF", "SUPERVISOR", "MANAGER"],
  },
  {
    id: 4,
    name: "Correction",
    icon: "edit_calendar",
    children: [
      {
        id: 41,
        name: "Request",
        path: "/app/attendanceCorrection",
        roles: ["STAFF", "SUPERVISOR", "MANAGER"],
      },
      {
        id: 42,
        name: "Approval",
        path: "/app/correctionApproval",
        roles: ["SUPERVISOR", "MANAGER"],
      },
    ],
    roles: ["STAFF", "SUPERVISOR", "MANAGER"],
  },
  {
    id: 5,
    name: "Overtime",
    icon: "more_time",
    children: [
      {
        id: 51,
        name: "Checking",
        path: "/app/overtimeRequest",
        roles: ["STAFF", "SUPERVISOR", "MANAGER"],
      },
      {
        id: 52,
        name: "Approval",
        path: "/app/overtimeApproval",
        roles: ["SUPERVISOR", "MANAGER"],
      },
    ],
    roles: ["STAFF", "SUPERVISOR", "MANAGER"],
  },
  {
    id: 6,
    name: "Master",
    icon: "master",
    children: [
      {
        id: 61,
        name: "Leave Type",
        icon: "fact_check",
        path: "/app/m-leaveType",
        roles: ["ADMIN"],
      },
    ],
    roles: ["ADMIN"],
  },
  {
    id: 7,
    name: "Admin",
    icon: "admin_panel_settings",
    children: [
      {
        id: 71,
        name: "Update Data",
        icon: "fact_check",
        path: "/app/updateData",
        roles: ["ADMIN"],
      },
    ],
    roles: ["ADMIN"],
  },
];
