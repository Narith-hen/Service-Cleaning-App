import React, { createContext, useState, useContext, useEffect } from 'react';

// Create Theme Context
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light'; 
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [darkMode, setDarkMode] = useState(theme === 'dark');

  // Update darkMode when theme changes
  useEffect(() => {
    setDarkMode(theme === 'dark');
    
    // Apply theme to document body
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Set specific theme
  const setLightMode = () => setTheme('light');
  const setDarkMode2 = () => setTheme('dark');

  return (
    <ThemeContext.Provider value={{
      theme,
      darkMode,
      toggleTheme,
      setLightMode,
      setDarkMode: setDarkMode2
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