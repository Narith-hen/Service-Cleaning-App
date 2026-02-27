import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mock notifications data
const mockNotifications = [
    {
        id: 1,
        type: 'success',
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed for tomorrow at 2:00 PM',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        is_read: false,
        link: '/customer/bookings/1'
    },
    {
        id: 2,
        type: 'info',
        title: 'New Message',
        message: 'Maria Garcia sent you a message about your upcoming cleaning',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        is_read: false,
        link: '/messages/2'
    },
    {
        id: 3,
        type: 'warning',
        title: 'Profile Incomplete',
        message: 'Please complete your profile to continue receiving bookings',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        is_read: true,
        link: '/profile'
    },
    {
        id: 4,
        type: 'error',
        title: 'Payment Failed',
        message: 'Your payment of $45.00 failed. Please update your payment method',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        is_read: true,
        link: '/payment-methods'
    },
    {
        id: 5,
        type: 'success',
        title: 'Review Received',
        message: 'You received a 5-star review from John Smith',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        is_read: false,
        link: '/reviews'
    }
];

// Create the store - this IS the hook!
export const useNotificationStore = create(
    persist(
        (set, get) => ({
            // State
            notifications: [],
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
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    set({ 
                        notifications: mockNotifications,
                        unreadCount: mockNotifications.filter(n => !n.is_read).length,
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
                
                set({
                    notifications: notifications.map(n => 
                        n.id === notificationId ? { ...n, is_read: true } : n
                    ),
                    unreadCount: Math.max(0, get().unreadCount - 1)
                });
            },

            // Mark all as read
            markAllAsRead: () => {
                const { notifications } = get();
                
                set({
                    notifications: notifications.map(n => ({ ...n, is_read: true })),
                    unreadCount: 0
                });
            },

            // Delete notification
            deleteNotification: (notificationId) => {
                const { notifications } = get();
                const notification = notifications.find(n => n.id === notificationId);
                
                set({
                    notifications: notifications.filter(n => n.id !== notificationId),
                    unreadCount: notification?.is_read 
                        ? get().unreadCount 
                        : Math.max(0, get().unreadCount - 1)
                });
            },

            // Clear all notifications
            clearAll: () => {
                set({ notifications: [], unreadCount: 0 });
            },

            // Reset error
            clearError: () => {
                set({ error: null });
            }
        }),
        {
            name: 'notification-storage',
            partialize: (state) => ({ 
                notifications: state.notifications,
                unreadCount: state.unreadCount 
            }),
        }
    )
);