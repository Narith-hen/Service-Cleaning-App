import { useState, useEffect } from 'react';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const AUTH_USER_UPDATED_EVENT = 'auth-user-updated';
const ENABLE_MOCK_AUTH = import.meta.env.DEV && String(import.meta.env.VITE_ENABLE_MOCK_AUTH || '').toLowerCase() === 'true';

const readStoredUser = () => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error('Failed to parse saved user:', error);
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

const normalizeAvatarUrl = (avatar) => {
  if (!avatar) return null;
  const cleaned = String(avatar).replace(/\\/g, '/').trim();
  if (!cleaned) return null;
  if (/^data:/i.test(cleaned)) return cleaned;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.startsWith('/')) return `${API_BASE_URL}${cleaned}`;
  if (cleaned.startsWith('uploads/') || cleaned.startsWith('public/')) {
    return `${API_BASE_URL}/${cleaned}`;
  }
  return cleaned;
};

const normalizeUserData = (payload = {}, previous = null) => {
  const firstName = payload.first_name ?? previous?.first_name ?? '';
  const lastName = payload.last_name ?? previous?.last_name ?? '';
  const roleId = payload.role_id ?? previous?.role_id ?? 2;
  const companyName = payload.company_name ?? payload.companyName ?? previous?.company_name ?? '';
  const shouldPreferCompanyName = Boolean(companyName) && !payload.company_name && !payload.companyName;
  const mergedName =
    (shouldPreferCompanyName ? '' : payload.name) ||
    companyName ||
    [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id: payload.user_id ?? previous?.id ?? previous?.user_id ?? payload.id,
    user_id: payload.user_id ?? previous?.user_id ?? payload.id,
    user_code: payload.user_code ?? previous?.user_code ?? null,
    company_name: companyName || previous?.company_name || '',
    name: mergedName || previous?.name || 'Customer',
    first_name: firstName,
    last_name: lastName,
    email: payload.email ?? previous?.email ?? '',
    phone: payload.phone ?? payload.phone_number ?? previous?.phone ?? '',
    phone_number: payload.phone_number ?? payload.phone ?? previous?.phone_number ?? '',
    address: payload.address ?? previous?.address ?? '',
    latitude: payload.latitude ?? previous?.latitude ?? '',
    longitude: payload.longitude ?? previous?.longitude ?? '',
    account_status: payload.account_status ?? payload.status ?? previous?.account_status ?? '',
    city: payload.city ?? previous?.city ?? '',
    state: payload.state ?? previous?.state ?? '',
    country: payload.country ?? previous?.country ?? '',
    avatar: normalizeAvatarUrl(payload.avatar ?? previous?.avatar ?? null),
    joinDate: payload.joinDate ?? payload.join_date ?? previous?.joinDate ?? null,
    totalBookings: payload.totalBookings ?? payload.total_bookings ?? previous?.totalBookings ?? 0,
    totalSpent: payload.totalSpent ?? payload.total_spent ?? previous?.totalSpent ?? 0,
    role_id: roleId,
    token: payload.token ?? previous?.token ?? null,
    account_source: payload.account_source ?? previous?.account_source ?? 'users',
    role: (
      payload.role ||
      payload.role_name ||
      previous?.role ||
      (roleId === 1 ? 'admin' : roleId === 2 ? 'cleaner' : 'customer')
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
};

// Mock users for testing
const MOCK_USERS = {
  admin: {
    id: 1,
    name: 'Alex Johnson',
    email: 'admin@example.com',
    role: 'admin',
    avatar: null,
    permissions: ['all'],
  },
  customer: {
    id: 2,
    name: 'John Smith',
    email: 'john@example.com',
    role: 'customer',
    avatar: null,
    phone: '+1 234-567-8901',
    address: '123 Main St, New York, NY',
  },
  cleaner: {
    id: 3,
    name: 'Maria Garcia',
    email: 'maria@example.com',
    role: 'cleaner',
    avatar: null,
    rating: 4.9,
    completedJobs: 156,
    specialties: ['Deep Cleaning', 'Move Out/In'],
  },
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for saved user in localStorage on mount, then refresh profile when token exists.
  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      const savedUser = readStoredUser();
      if (!savedUser) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (isMounted) setUser(savedUser);

      if (savedUser?.token) {
        try {
          const profile = await fetchProfileFromApi(savedUser.token);
          const normalized = normalizeUserData(profile, savedUser);
          if (isMounted) setUser(normalized);
          persistUser(normalized);
        } catch (profileError) {
          console.warn('Failed to refresh profile from API:', profileError.message);
        }
      }

      if (isMounted) setLoading(false);
    };

    const syncFromStorage = () => {
      if (!isMounted) return;
      setUser(readStoredUser());
    };

    hydrateUser();

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(AUTH_USER_UPDATED_EVENT, syncFromStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, syncFromStorage);
    };
  }, []);

  // Login function
  const login = async (email, password, role = 'customer') => {
    setLoading(true);
    setError(null);

    try {
      const normalizedEmail = String(email || '').trim();
      const normalizedPassword = String(password || '');

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }
      if (!response.ok || !result?.success) {
        const message = result?.message || (response.status ? `Login failed (HTTP ${response.status})` : 'Login failed');
        throw new Error(message);
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
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));

      return { success: true, user: normalizedUser };
    } catch (error) {
      if (ENABLE_MOCK_AUTH) {
        // Mock fallback for local testing without API
        let userToLogin = null;
        if (email) {
          userToLogin = Object.values(MOCK_USERS).find((mockUser) => (
            mockUser.email.toLowerCase() === String(email).toLowerCase()
          ));
        } else {
          userToLogin = MOCK_USERS[role];
        }

        if (userToLogin && password === 'password123') {
          setUser(userToLogin);
          localStorage.setItem('user', JSON.stringify(userToLogin));
          window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
          return { success: true, user: userToLogin };
        }
      }

      const message = error.message || 'Invalid email or password';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Quick login functions for testing
  const loginAsAdmin = () => login('admin@example.com', 'password123', 'admin');
  const loginAsCustomer = () => login('john@example.com', 'password123', 'customer');
  const loginAsCleaner = () => login('maria@example.com', 'password123', 'cleaner');

  const logout = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUser(null);
      localStorage.removeItem('user');
      window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
      return { success: true };
    } catch (logoutError) {
      setError(logoutError.message);
      return { success: false, error: logoutError.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const existingUser = Object.values(MOCK_USERS).find((mockUser) => (
        mockUser.email.toLowerCase() === userData.email.toLowerCase()
      ));

      if (existingUser) {
        throw new Error('Email already exists');
      }

      const newUser = {
        id: Date.now(),
        ...userData,
        role_id: userData.role_id || 2,
        role: userData.role || 'customer',
      };

      return { success: true, user: newUser };
    } catch (registerError) {
      setError(registerError.message);
      return { success: false, error: registerError.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    try {
      if (!user.token) {
        const updatedMockUser = normalizeUserData(userData, user);
        setUser(updatedMockUser);
        persistUser(updatedMockUser);
        return { success: true, user: updatedMockUser };
      }

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

      const updatedUser = normalizeUserData({ ...userData, ...(result.data || {}) }, user);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
      
      return { success: true, user: updatedUser };
    } catch (updateError) {
      setError(updateError.message);
      return { success: false, error: updateError.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!file) return { success: false, error: 'No file selected' };
    if (!user.token) return { success: false, error: 'Mock users cannot upload avatars' };

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
      persistUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (uploadError) {
      setError(uploadError.message);
      return { success: false, error: uploadError.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    role: user?.role || null,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    isCleaner: user?.role === 'cleaner',
    login,
    loginAsAdmin,
    loginAsCustomer,
    loginAsCleaner,
    logout,
    register,
    updateUser,
    uploadAvatar,
    MOCK_USERS,
  };
};

export default useAuth;
