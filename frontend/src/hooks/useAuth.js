import { useState, useEffect } from 'react';

<<<<<<< HEAD
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const AUTH_USER_UPDATED_EVENT = 'auth-user-updated';

const normalizeAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  if (avatar.startsWith('/')) return `${API_BASE_URL}${avatar}`;
  return avatar;
};

const normalizeUserData = (payload = {}, previous = null) => {
  const firstName = payload.first_name ?? previous?.first_name ?? '';
  const lastName = payload.last_name ?? previous?.last_name ?? '';
  const mergedName = payload.name || [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id: payload.user_id ?? previous?.id ?? previous?.user_id ?? payload.id,
    user_id: payload.user_id ?? previous?.user_id ?? payload.id,
    user_code: payload.user_code ?? previous?.user_code ?? null,
    name: mergedName || previous?.name || 'Customer',
    first_name: firstName,
    last_name: lastName,
    email: payload.email ?? previous?.email ?? '',
    phone: payload.phone ?? payload.phone_number ?? previous?.phone ?? '',
    phone_number: payload.phone_number ?? payload.phone ?? previous?.phone_number ?? '',
    city: payload.city ?? previous?.city ?? '',
    state: payload.state ?? previous?.state ?? '',
    country: payload.country ?? previous?.country ?? '',
    avatar: normalizeAvatarUrl(payload.avatar ?? previous?.avatar ?? null),
    joinDate: payload.joinDate ?? previous?.joinDate ?? null,
    totalBookings: payload.totalBookings ?? previous?.totalBookings ?? 0,
    totalSpent: payload.totalSpent ?? previous?.totalSpent ?? 0,
    role_id: payload.role_id ?? previous?.role_id ?? 2,
    token: payload.token ?? previous?.token ?? null,
    role: (
      payload.role ||
      payload.role_name ||
      previous?.role ||
      (payload.role_id === 1 ? 'admin' : payload.role_id === 3 ? 'cleaner' : 'customer')
    ).toLowerCase(),
  };
};

const fetchProfileFromApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || 'Failed to load profile');
  }

  return result.data || {};
=======
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
>>>>>>> develop
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
<<<<<<< HEAD
    let isMounted = true;

    const hydrateUser = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);
        if (isMounted) setUser(parsedUser);

        if (parsedUser?.token) {
          try {
            const profile = await fetchProfileFromApi(parsedUser.token);
            const normalized = normalizeUserData(profile, parsedUser);
            if (isMounted) setUser(normalized);
            localStorage.setItem('user', JSON.stringify(normalized));
          } catch (profileError) {
            console.warn('Failed to refresh profile from API:', profileError.message);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('user');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateUser();

    const syncFromStorage = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) return;
        const parsedUser = JSON.parse(savedUser);
        if (isMounted) {
          setUser(parsedUser);
        }
      } catch {
        // Ignore malformed localStorage payload
      }
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(AUTH_USER_UPDATED_EVENT, syncFromStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, syncFromStorage);
=======
    setUser(readStoredUser());
    const handleUserUpdated = () => setUser(readStoredUser());
    window.addEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);
    setLoading(false);

    return () => {
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated);
>>>>>>> develop
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
      let normalizedUser = normalizeUserData(userData);

      if (normalizedUser?.token) {
        try {
          const profileData = await fetchProfileFromApi(normalizedUser.token);
          normalizedUser = normalizeUserData(profileData, normalizedUser);
        } catch (profileError) {
          console.warn('Failed to fetch profile after login:', profileError.message);
        }
      }

      setUser(normalizedUser);
<<<<<<< HEAD
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
=======
      persistUser(normalizedUser);
>>>>>>> develop

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
<<<<<<< HEAD
        localStorage.setItem('user', JSON.stringify(userToLogin));
        window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
=======
        persistUser(userToLogin);
>>>>>>> develop
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
<<<<<<< HEAD
      localStorage.removeItem('user');
      window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
=======
      persistUser(null);
>>>>>>> develop
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
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to update profile');
      }

      const updatedUser = normalizeUserData(result.data || {}, user);
      setUser(updatedUser);
<<<<<<< HEAD
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
=======
      persistUser(updatedUser);
>>>>>>> develop
      
      return { success: true, user: updatedUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!file) return { success: false, error: 'No file selected' };

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE_URL}/api/auth/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to upload avatar');
      }

      const updatedUser = normalizeUserData(result.data || {}, user);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));

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
    uploadAvatar,
    
    // Mock users data (for testing)
    MOCK_USERS
  };
};

export default useAuth;
