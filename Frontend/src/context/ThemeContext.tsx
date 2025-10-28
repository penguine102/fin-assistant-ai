import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red'

// Theme colors
const themeColors = {
  blue: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#60a5fa',
  },
  green: {
    primary: '#10b981',
    secondary: '#047857',
    accent: '#34d399',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
  },
  orange: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
  },
  red: {
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#f87171',
  },
}

// Light theme
const lightTheme = {
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
      disabled: '#94a3b8',
    },
    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
      dark: '#94a3b8',
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
}

// Dark theme
const darkTheme = {
  ...lightTheme,
  colors: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      elevated: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
      disabled: '#64748b',
    },
    border: {
      light: '#334155',
      medium: '#475569',
      dark: '#64748b',
    },
    surface: {
      primary: '#1e293b',
      secondary: '#334155',
      tertiary: '#475569',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
    },
  },
}

// Theme context
interface ThemeContextType {
  mode: ThemeMode
  color: ThemeColor
  theme: typeof lightTheme
  toggleMode: () => void
  setMode: (mode: ThemeMode) => void
  setColor: (color: ThemeColor) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

// Theme provider
interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode')
    return (saved as ThemeMode) || 'system'
  })
  
  const [color, setColorState] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('theme-color')
    return (saved as ThemeColor) || 'blue'
  })

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    localStorage.setItem('theme-mode', mode)
  }, [mode])

  useEffect(() => {
    localStorage.setItem('theme-color', color)
  }, [color])

  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark)
  const theme = isDark ? darkTheme : lightTheme
  const colorTheme = themeColors[color]

  const toggleMode = () => {
    setModeState(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
  }

  const setColor = (newColor: ThemeColor) => {
    setColorState(newColor)
  }

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Set CSS custom properties
    root.style.setProperty('--color-primary', colorTheme.primary)
    root.style.setProperty('--color-secondary', colorTheme.secondary)
    root.style.setProperty('--color-accent', colorTheme.accent)
    
    // Set theme mode
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    
    // Set color scheme
    root.setAttribute('data-color', color)
  }, [isDark, color, colorTheme])

  return (
    <ThemeContext.Provider
      value={{
        mode,
        color,
        theme,
        toggleMode,
        setMode,
        setColor,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

// Theme toggle component
export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode, isDark } = useTheme()

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'system':
        return '💻'
      default:
        return '☀️'
    }
  }

  const getTooltip = () => {
    switch (mode) {
      case 'light':
        return 'Switch to dark mode'
      case 'dark':
        return 'Switch to system mode'
      case 'system':
        return 'Switch to light mode'
      default:
        return 'Toggle theme'
    }
  }

  return (
    <button
      onClick={toggleMode}
      className="theme-toggle"
      title={getTooltip()}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'none',
        background: isDark ? '#1e293b' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        transition: 'all 0.2s ease',
        boxShadow: isDark 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.4)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {getIcon()}
    </button>
  )
}

// Color picker component
export const ColorPicker: React.FC = () => {
  const { color, setColor } = useTheme()

  const colors: { name: ThemeColor; hex: string }[] = [
    { name: 'blue', hex: '#3b82f6' },
    { name: 'green', hex: '#10b981' },
    { name: 'purple', hex: '#8b5cf6' },
    { name: 'orange', hex: '#f59e0b' },
    { name: 'red', hex: '#ef4444' },
  ]

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {colors.map(({ name, hex }) => (
        <button
          key={name}
          onClick={() => setColor(name)}
          className="color-picker"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: color === name ? '3px solid #ffffff' : '2px solid transparent',
            background: hex,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: color === name 
              ? '0 0 0 2px var(--color-primary)' 
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
          title={`Switch to ${name} theme`}
        />
      ))}
    </div>
  )
}

export default {
  ThemeProvider,
  useTheme,
  ThemeToggle,
  ColorPicker,
  lightTheme,
  darkTheme,
  themeColors,
}
