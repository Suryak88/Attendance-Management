export const approvalStatus = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELLED: 3,
  REVOKED: 4,
};

export const approvalStatusConfig = {
  [approvalStatus.PENDING]: {
    label: "Pending",
    badgeClass: "bg-amber-100 outline-amber-500 text-amber-700",
    dotClass: "bg-amber-400",
  },
  [approvalStatus.APPROVED]: {
    label: "Approved",
    badgeClass: "bg-green-100 outline-green-500 text-green-700",
    dotClass: "bg-green-400",
  },
  [approvalStatus.REJECTED]: {
    label: "Rejected",
    badgeClass: "bg-red-100 outline-red-500 text-red-700",
    dotClass: "bg-red-500",
  },
  [approvalStatus.CANCELLED]: {
    label: "Cancelled",
    badgeClass: "bg-slate-200 outline-slate-500 text-slate-700",
    dotClass: "bg-slate-500",
  },
  [approvalStatus.REVOKED]: {
    label: "Revoked",
    badgeClass: "bg-slate-200 outline-red-600 text-red-800",
    dotClass: "bg-red-500",
  },
};
