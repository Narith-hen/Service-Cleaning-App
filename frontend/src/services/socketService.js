import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:4000';

let socketInstance = null;

export const getRealtimeAuthToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.token || localStorage.getItem('token') || null;
  } catch {
    return localStorage.getItem('token') || null;
  }
};

export const getRealtimeUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.id || stored?.user_id || null;
  } catch {
    return null;
  }
};

export const getRealtimeSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }

  return socketInstance;
};

export const ensureRealtimeSocketConnected = () => {
  const socket = getRealtimeSocket();
  if (socket.connected) return socket;

  const token = getRealtimeAuthToken();
  if (!token) return socket;

  socket.auth = {
    token,
    userId: getRealtimeUserId() || 'unknown'
  };
  socket.connect();
  return socket;
};
