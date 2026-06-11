import { create } from "zustand";
import api from "../utils/axiosInstance";

export const useLeaveTypeStore = create((set) => ({
  leaveTypes: [],
  loaded: false,
  loading: false,

  fetchLeaveTypes: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/leaveType/LT");
      set({ leaveTypes: res.data, loading: false, loaded: true });
    } catch (err) {
      console.error(`fetching leavetypes error: ${err}`);
      set({
        loading: false,
      });
    }
  },

  reset: () => set({ leaveTypes: [], loaded: false }),

  // setCategories: (data) => set({ categories: data }),
  // addCategory: (cat) =>
  //   set((state) => ({
  //     categories: [...state.categories, cat],
  //   })),
}));
