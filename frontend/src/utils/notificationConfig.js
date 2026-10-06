import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Mail,
  Megaphone,
} from "lucide-react";

export const notificationConfig = {
  LEAVE_APPROVED: {
    icon: CircleCheck,
    styling: "text-green-600",
    path: "/app/leaveRequest",
  },
  LEAVE_REJECTED: {
    icon: CircleX,
    styling: "text-red-600",
    path: "/app/leaveRequest",
  },
  LEAVE_REVOKED: {
    icon: CircleAlert,
    styling: "text-red-600",
    path: "/app/leaveRequest",
  },
  LEAVE_REVISE_APPROVED: {
    icon: CircleCheck,
    styling: "text-green-600",
    path: "/app/leaveRequest",
  },
  LEAVE_REVISE_REJECTED: {
    icon: CircleX,
    styling: "text-red-600",
    path: "/app/leaveRequest",
  },
  CORRECTION_APPROVED: {
    icon: CircleCheck,
    styling: "text-green-600",
    path: "/app/attendanceCorrection",
  },
  CORRECTION_REJECTED: {
    icon: CircleX,
    styling: "text-red-600",
    path: "/app/attendanceCorrection",
  },
  OVERTIME_APPROVED: {
    icon: CircleCheck,
    styling: "text-green-600",
    path: "/app/overtimeRequest",
  },
  OVERTIME_REJECTED: {
    icon: CircleX,
    styling: "text-red-600",
    path: "/app/overtimeRequest",
  },
  LEAVE_SUBMITTED: {
    icon: Mail,
    styling: "text-blue-500",
    path: "/app/leaveApproval",
  },
  LEAVE_REVISE_SUBMITTED: {
    icon: Mail,
    styling: "text-blue-500",
    path: "/app/leaveApproval",
  },
  CORRECTION_SUBMITTED: {
    icon: Mail,
    styling: "text-blue-500",
    path: "/app/correctionApproval",
  },
  OVERTIME_SUBMITTED: {
    icon: Mail,
    styling: "text-blue-500",
    path: "/app/overtimeApproval",
  },
  ATTENDANCE_UPDATED: {
    icon: Megaphone,
    styling: "text-blue-500",
    path: "/app/attendance-log",
  },
};

export const formatNotif = (notif) => {
  return notif.map((n) => {
    const config = notificationConfig[n.type];
    return {
      ...n,
      icon: config?.icon,
      styling: config?.styling,
      path: config?.path,
    };
  });
};
