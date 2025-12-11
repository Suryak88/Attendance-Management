import { create } from "zustand";

export const useCategoryStore = create((set) => ({
  categories: [],
  setCategories: (data) => set({ categories: data }),
  addCategory: (cat) =>
    set((state) => ({
      categories: [...state.categories, cat],
    })),
}));
