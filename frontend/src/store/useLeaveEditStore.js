import { create } from "zustand";

export const useLeaveEditStore = create((set) => ({
  selectedLeave: null, // data leaveType yang ingin diedit
  isEditOpen: false, // state modal
  openEdit: (leave) => set({ selectedLeave: leave, isEditOpen: true }),
  closeEdit: () => set({ selectedLeave: null, isEditOpen: false }),
}));
