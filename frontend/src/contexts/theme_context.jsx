import React, { createContext, useState, useContext, useEffect } from 'react';

// Create Theme Context
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    try {
      const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      return savedTheme || 'light';
    } catch (error) {
      console.error('Failed to read theme from storage:', error);
      return 'light';
    }
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [darkMode, setDarkMode] = useState(theme === 'dark');

  // Update darkMode when theme changes
  useEffect(() => {
    setDarkMode(theme === 'dark');
    
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      }
    }
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
    } catch (error) {
      console.error('Failed to save theme to storage:', error);
    }
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Set specific theme
  const setLightMode = () => setTheme('light');
  const enableDarkMode = () => setTheme('dark');

  return (
    <ThemeContext.Provider value={{
      theme,
      darkMode,
      toggleTheme,
      setLightMode,
      setDarkMode: enableDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use Theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
