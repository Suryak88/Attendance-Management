import { createContext, useContext } from "react";

export const LeaveTypeModalStateContext = createContext();
export const LeaveTypeModalActionsContext = createContext();

export function useLeaveModalState() {
  const context = useContext(LeaveTypeModalStateContext);
  if (!context) {
    throw new Error(
      "useLeaveModalState must be used within a LeaveTypeModalStateContext.Provider"
    );
  }
  return context;
}

export function useLeaveModalActions() {
  const context = useContext(LeaveTypeModalActionsContext);
  if (!context) {
    throw new Error(
      "useLeaveModalActions must be used within a LeaveTypeModalActionsContext.Provider"
    );
  }
  return context;
}
