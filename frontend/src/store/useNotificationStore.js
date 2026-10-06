import { create } from "zustand";
import api from "../utils/axiosInstance";

export const useNotificationStore = create((set, get) => ({
  notifications: {
    data: [],
    unread: 0,
  },

  isLoading: false,

  getNotif: async () => {
    set({ isLoading: true });

    try {
      const res = await api.get("/notification/");

      set({
        notifications: {
          data: res.data,
          unread: res.data.filter((n) => n.is_read === 0).length,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notif) => {
    if (notif.is_read) return;

    await api.put(`/notification/${notif.id}/read`);

    set((state) => {
      const existing = state.notifications.data.find(
        (item) => item.id === notif.id,
      );

      if (!existing || existing.is_read === 1) {
        return state;
      }

      return {
        notifications: {
          ...state.notifications,
          data: state.notifications.data.map((item) =>
            item.id === notif.id ? { ...item, is_read: 1 } : item,
          ),
          unread: Math.max(state.notifications.unread - 1, 0),
        },
      };
    });
  },

  markAllAsRead: async () => {
    if (get().notifications.unread === 0) return;

    await api.put(`/notification/readAll`);

    set((state) => ({
      notifications: {
        ...state.notifications,
        data: state.notifications.data.map((item) => ({ ...item, is_read: 1 })),
        unread: 0,
      },
    }));
  },

  resetNotif: () => {
    set({
      notifications: {
        data: [],
        unread: 0,
      },
      isLoading: false,
    });
  },
}));
