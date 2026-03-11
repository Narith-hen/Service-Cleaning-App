// src/store/simpleTestStore.js
import { create } from 'zustand';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const apiHost = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;
const API_URL = `${apiHost}/api/test`;

const useSimpleTestStore = create((set) => ({
  // State
  pingResponse: null,
  echoResponse: null,
  loading: false,
  error: null,

  // Test GET /ping
  testPing: async () => {
    set({ loading: true, error: null, pingResponse: null });
    
    try {
      console.log('🚀 Testing GET /ping endpoint...');
      
      const response = await fetch(`${API_URL}/ping`);
      const data = await response.json();
      
      console.log('✅ Ping response:', data);
      
      set({ 
        pingResponse: data, 
        loading: false 
      });
    } catch (error) {
      console.error('❌ Ping failed:', error);
      set({ 
        error: error.message, 
        loading: false 
      });
    }
  },

  // Test POST /echo
  testEcho: async (message = "Hello from frontend!") => {
    set({ loading: true, error: null, echoResponse: null });
    
    try {
      console.log('🚀 Testing POST /echo endpoint with message:', message);
      
      const response = await fetch(`${API_URL}/echo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: message,
          timestamp: new Date().toISOString(),
          user: "frontend-tester"
        })
      });
      
      const data = await response.json();
      
      console.log('✅ Echo response:', data);
      
      set({ 
        echoResponse: data, 
        loading: false 
      });
    } catch (error) {
      console.error('❌ Echo failed:', error);
      set({ 
        error: error.message, 
        loading: false 
      });
    }
  },

  // Clear all responses
  clearAll: () => set({ 
    pingResponse: null, 
    echoResponse: null, 
    error: null 
  })
}));

export default useSimpleTestStore;
