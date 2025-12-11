import { createContext, useContext } from "react";

export const LeaveTypeModalContext = createContext(null);

export function useLeaveModal() {
  return useContext(LeaveTypeModalContext);
}
