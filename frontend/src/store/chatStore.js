import { create } from 'zustand';

const SOUND_KEY = 'chat_sound_enabled_v1';

const readSoundPreference = () => {
  try {
    const stored = localStorage.getItem(SOUND_KEY);
    if (stored === null) return true;
    return stored === 'true';
  } catch {
    return true;
  }
};

const notifyCleanerNotificationSync = () => {
  try {
    window.dispatchEvent(new Event('cleaner-notifications-updated'));
  } catch {
    // Ignore non-browser environments.
  }
};

export const useChatStore = create((set, get) => ({
  soundEnabled: readSoundPreference(),
  onlineUsers: {},
  unreadByThread: {},
  setUserOnline: (userId) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [String(userId)]: true }
  })),
  setUserOffline: (userId) => set((state) => {
    const next = { ...state.onlineUsers };
    delete next[String(userId)];
    return { onlineUsers: next };
  }),
  incrementUnread: (threadId) => set((state) => {
    const key = String(threadId);
    const current = state.unreadByThread[key] || 0;
    notifyCleanerNotificationSync();
    return { unreadByThread: { ...state.unreadByThread, [key]: current + 1 } };
  }),
  clearUnread: (threadId) => set((state) => {
    const next = { ...state.unreadByThread };
    delete next[String(threadId)];
    notifyCleanerNotificationSync();
    return { unreadByThread: next };
  }),
  toggleSound: () => {
    const next = !get().soundEnabled;
    try {
      localStorage.setItem(SOUND_KEY, String(next));
    } catch {
      // Ignore storage issues
    }
    set({ soundEnabled: next });
  }
}));
