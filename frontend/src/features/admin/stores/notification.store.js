import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  buildAdminNotifications,
  countUnreadNotifications,
  fetchAllAdminBookings
} from '../utils/notificationFeed';

const REFRESH_WINDOW_MS = 60 * 1000;

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      dismissedIds: [],
      loading: false,
      error: null,
      lastFetched: null,

      fetchNotifications: async (force = false) => {
        const { notifications, dismissedIds, lastFetched, loading } = get();

        if (loading) return;

        if (!force && notifications.length > 0 && lastFetched) {
          if (Date.now() - lastFetched < REFRESH_WINDOW_MS) {
            return;
          }
        }

        set({ loading: true, error: null });

        try {
          const bookingRows = await fetchAllAdminBookings();
          const nextNotifications = buildAdminNotifications(
            bookingRows,
            notifications,
            dismissedIds
          );

          set({
            notifications: nextNotifications,
            unreadCount: countUnreadNotifications(nextNotifications),
            loading: false,
            lastFetched: Date.now()
          });
        } catch (error) {
          set({
            error: error?.message || 'Failed to fetch notifications',
            loading: false
          });
        }
      },

      markAsRead: (notificationId) => {
        const nextNotifications = get().notifications.map((notification) => (
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        ));

        set({
          notifications: nextNotifications,
          unreadCount: countUnreadNotifications(nextNotifications)
        });
      },

      markAllAsRead: () => {
        const nextNotifications = get().notifications.map((notification) => ({
          ...notification,
          is_read: true
        }));

        set({
          notifications: nextNotifications,
          unreadCount: 0
        });
      },

      deleteNotification: (notificationId) => {
        const dismissedIds = Array.from(new Set([...get().dismissedIds, notificationId]));
        const nextNotifications = get().notifications.filter(
          (notification) => notification.id !== notificationId
        );

        set({
          notifications: nextNotifications,
          unreadCount: countUnreadNotifications(nextNotifications),
          dismissedIds
        });
      },

      clearAll: () => {
        const existingIds = get().notifications.map((notification) => notification.id);
        const dismissedIds = Array.from(new Set([...get().dismissedIds, ...existingIds]));

        set({
          notifications: [],
          unreadCount: 0,
          dismissedIds
        });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'admin-notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        dismissedIds: state.dismissedIds,
        lastFetched: state.lastFetched
      })
    }
  )
);
