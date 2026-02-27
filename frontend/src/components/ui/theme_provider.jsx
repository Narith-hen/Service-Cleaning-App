import React, { createContext, useContext, useEffect, useState } from "react"

// Create context with default values
const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false
})

export function ThemeProvider({ 
  children, 
  defaultTheme = 'light', 
  storageKey = 'ui-theme' 
}) {
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem(storageKey)
    if (savedTheme) return savedTheme
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return defaultTheme
  })

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }

  // Set specific theme
  const setTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setThemeState(newTheme)
      localStorage.setItem(storageKey, newTheme)
    }
  }

  // Apply theme to HTML element
  useEffect(() => {
    const root = document.documentElement
    
    // Remove old theme classes
    root.classList.remove('light', 'dark')
    
    // Apply new theme
    if (theme === 'system') {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    
    // Update data-theme attribute for CSS variables
    root.setAttribute('data-theme', theme)
    
    // Save to localStorage
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  // Context value
  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}