import { useState, useEffect } from 'react';

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
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login function - pass role to select which user to login as
  const login = async (email, password, role = 'customer') => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find user by role or email
      let userToLogin = null;
      
      if (email) {
        // Find by email (case insensitive)
        userToLogin = Object.values(MOCK_USERS).find(
          u => u.email.toLowerCase() === email.toLowerCase()
        );
      } else {
        // Default to role-based login for testing
        userToLogin = MOCK_USERS[role];
      }

      if (!userToLogin) {
        throw new Error('Invalid email or password');
      }

      // Mock password check (in real app, this would be done on backend)
      if (password && password !== 'password123') {
        throw new Error('Invalid password');
      }

      // Set user and save to localStorage
      setUser(userToLogin);
      localStorage.setItem('user', JSON.stringify(userToLogin));
      
      return { success: true, user: userToLogin };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
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
      localStorage.removeItem('user');
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
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
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