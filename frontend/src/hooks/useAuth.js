import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const AUTH_USER_UPDATED_EVENT = 'auth:user-updated';

const readStoredUser = () => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch (e) {
    console.error('Failed to parse saved user:', e);
    localStorage.removeItem('user');
    return null;
  }
};

const persistUser = (nextUser) => {
  if (nextUser) {
    localStorage.setItem('user', JSON.stringify(nextUser));
  } else {
    localStorage.removeItem('user');
  }

  window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
};

// Mock users for testing
const MOCK_USERS = {
  admin: {
    id: 1,
    name: 'Alex Johnson',
    email: 'admin@example.com',
    role: 'admin',
    avatar: null,
    permissions: ['all']
  },
  customer: {
    id: 2,
    name: 'John Smith',
    email: 'john@example.com',
    role: 'customer',
    avatar: null,
    phone: '+1 234-567-8901',
    address: '123 Main St, New York, NY'
  },
  cleaner: {
    id: 3,
    name: 'Maria Garcia',
    email: 'maria@example.com',
    role: 'cleaner',
    avatar: null,
    rating: 4.9,
    completedJobs: 156,
    specialties: ['Deep Cleaning', 'Move Out/In']
  }
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for saved user in localStorage on mount
  useEffect(() => {
    setUser(readStoredUser());
    const handleUserUpdated = () => setUser(readStoredUser());
    window.addEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);
    setLoading(false);

    return () => {
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);
    };
  }, []);

  // Login function
  const login = async (email, password, role = 'customer') => {
    setLoading(true);
    setError(null);

    try {
      // Real API login
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Invalid email or password');
      }

      const userData = result.data || {};
      const normalizedUser = {
        id: userData.user_id,
        user_id: userData.user_id,
        user_code: userData.user_code,
        name: [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim(),
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone_number,
        role_id: userData.role_id,
        role: (userData.role || userData.role_name || (userData.role_id === 1 ? 'admin' : userData.role_id === 3 ? 'cleaner' : 'customer')).toLowerCase()
      };

      setUser(normalizedUser);
      persistUser(normalizedUser);

      return { success: true, user: normalizedUser };
    } catch (err) {
      // Mock fallback for local testing without API
      let userToLogin = null;
      if (email) {
        userToLogin = Object.values(MOCK_USERS).find(
          u => u.email.toLowerCase() === email.toLowerCase()
        );
      } else {
        userToLogin = MOCK_USERS[role];
      }

      if (userToLogin && password === 'password123') {
        setUser(userToLogin);
        persistUser(userToLogin);
        return { success: true, user: userToLogin };
      }

      setError(err.message || 'Invalid email or password');
      return { success: false, error: err.message || 'Invalid email or password' };
    } finally {
      setLoading(false);
    }
  };

  // Quick login functions for testing
  const loginAsAdmin = () => login('admin@sevanow.com', 'password123', 'admin');
  const loginAsCustomer = () => login('john@example.com', 'password123', 'customer');
  const loginAsCleaner = () => login('maria@sevanow.com', 'password123', 'cleaner');

  const logout = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setUser(null);
      persistUser(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if email already exists
      const existingUser = Object.values(MOCK_USERS).find(
        u => u.email.toLowerCase() === userData.email.toLowerCase()
      );

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Create new user (in real app, this would be done on backend)
      const newUser = {
        id: Date.now(),
        ...userData,
        role_id: userData.role_id || 2,
        role: userData.role || 'customer'
      };

      // In mock mode, we just return success without actually storing
      return { success: true, user: newUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      persistUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    isCleaner: user?.role === 'cleaner',
    
    // Login methods
    login,
    loginAsAdmin,
    loginAsCustomer,
    loginAsCleaner,
    
    // Other methods
    logout,
    register,
    updateUser,
    
    // Mock users data (for testing)
    MOCK_USERS
  };
};

export default useAuth;
