import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    buildCleanerNotifications,
    loadCleanerNotifications,
    saveCleanerNotifications
} from '../utils/notificationSync';

// Create the store - this IS the hook!
export const useNotificationStore = create(
    persist(
        (set, get) => ({
            // State
            notifications: loadCleanerNotifications(),
            unreadCount: 0,
            loading: false,
            error: null,
            lastFetched: null,

            // Fetch notifications
            fetchNotifications: async (force = false) => {
                const { lastFetched, notifications } = get();
                
                // Don't refetch if we have data and it's been less than 5 minutes
                if (!force && notifications.length > 0 && lastFetched) {
                    const fiveMinutes = 5 * 60 * 1000;
                    if (Date.now() - lastFetched < fiveMinutes) {
                        return;
                    }
                }

                set({ loading: true, error: null });
                
                try {
                    const nextNotifications = await buildCleanerNotifications();
                    
                    set({ 
                        notifications: nextNotifications,
                        unreadCount: nextNotifications.filter(n => !n.is_read).length,
                        loading: false,
                        lastFetched: Date.now()
                    });
                } catch (error) {
                    set({ 
                        error: error.message || 'Failed to fetch notifications',
                        loading: false 
                    });
                }
            },

            // Mark single notification as read
            markAsRead: (notificationId) => {
                const { notifications } = get();
                const nextNotifications = notifications.map(n =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                );
                
                set({
                    notifications: nextNotifications,
                    unreadCount: notifications.filter(n => !n.is_read && n.id !== notificationId).length
                });
                saveCleanerNotifications(nextNotifications);
            },

            // Mark all as read
            markAllAsRead: () => {
                const { notifications } = get();
                const nextNotifications = notifications.map(n => ({ ...n, is_read: true }));
                
                set({
                    notifications: nextNotifications,
                    unreadCount: 0
                });
                saveCleanerNotifications(nextNotifications);
            },

            // Delete notification
            deleteNotification: (notificationId) => {
                const { notifications } = get();
                const notification = notifications.find(n => n.id === notificationId);
                const remaining = notifications.filter(n => n.id !== notificationId);
                const persisted = notifications.map((entry) =>
                    entry.id === notificationId ? { ...entry, dismissed: true, is_read: true } : entry
                );
                
                set({
                    notifications: remaining,
                    unreadCount: notification?.is_read 
                        ? get().unreadCount
                        : Math.max(0, get().unreadCount - 1)
                });
                saveCleanerNotifications(persisted);
            },

            // Clear all notifications
            clearAll: () => {
                set({ notifications: [], unreadCount: 0 });
                saveCleanerNotifications([]);
            },

            // Reset error
            clearError: () => {
                set({ error: null });
            }
        }),
        {
            name: 'cleaner-notification-storage',
            partialize: (state) => ({ 
                notifications: state.notifications,
                unreadCount: state.unreadCount 
            }),
        }
    )
);
