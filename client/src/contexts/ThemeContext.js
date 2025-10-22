import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Create context
const ThemeContext = createContext();

// Initial state
const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  moodTheme: localStorage.getItem('moodTheme') || false,
  adaptiveTheme: localStorage.getItem('adaptiveTheme') === 'true' || true,
  systemTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
};

// Action types
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_MOOD_THEME: 'SET_MOOD_THEME',
  SET_ADAPTIVE_THEME: 'SET_ADAPTIVE_THEME',
  SET_SYSTEM_THEME: 'SET_SYSTEM_THEME',
  TOGGLE_THEME: 'TOGGLE_THEME',
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };
    
    case THEME_ACTIONS.SET_MOOD_THEME:
      return {
        ...state,
        moodTheme: action.payload,
      };
    
    case THEME_ACTIONS.SET_ADAPTIVE_THEME:
      return {
        ...state,
        adaptiveTheme: action.payload,
      };
    
    case THEME_ACTIONS.SET_SYSTEM_THEME:
      return {
        ...state,
        systemTheme: action.payload,
      };
    
    case THEME_ACTIONS.TOGGLE_THEME:
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      };
    
    default:
      return state;
  }
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      dispatch({
        type: THEME_ACTIONS.SET_SYSTEM_THEME,
        payload: e.matches ? 'dark' : 'light',
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

  // Save mood theme to localStorage
  useEffect(() => {
    localStorage.setItem('moodTheme', state.moodTheme);
  }, [state.moodTheme]);

  // Save adaptive theme to localStorage
  useEffect(() => {
    localStorage.setItem('adaptiveTheme', state.adaptiveTheme);
  }, [state.adaptiveTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Apply current theme
    if (state.adaptiveTheme && state.moodTheme) {
      // Use mood-based theme
      root.classList.add(state.moodTheme);
    } else {
      // Use regular theme
      root.classList.add(state.theme);
    }
  }, [state.theme, state.moodTheme, state.adaptiveTheme]);

  // Set theme
  const setTheme = (theme) => {
    dispatch({
      type: THEME_ACTIONS.SET_THEME,
      payload: theme,
    });
  };

  // Set mood theme
  const setMoodTheme = (mood) => {
    dispatch({
      type: THEME_ACTIONS.SET_MOOD_THEME,
      payload: mood,
    });
  };

  // Set adaptive theme
  const setAdaptiveTheme = (enabled) => {
    dispatch({
      type: THEME_ACTIONS.SET_ADAPTIVE_THEME,
      payload: enabled,
    });
  };

  // Toggle theme
  const toggleTheme = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_THEME });
  };

  // Get effective theme (considers adaptive and mood themes)
  const getEffectiveTheme = () => {
    if (state.adaptiveTheme && state.moodTheme) {
      return state.moodTheme;
    }
    return state.theme;
  };

  // Get theme colors based on current theme
  const getThemeColors = () => {
    const effectiveTheme = getEffectiveTheme();
    
    const themeColors = {
      light: {
        primary: '#0ea5e9',
        secondary: '#d946ef',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#475569',
        border: '#e2e8f0',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      dark: {
        primary: '#38bdf8',
        secondary: '#e879f9',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#cbd5e1',
        border: '#334155',
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171',
      },
      'mood-happy': {
        primary: '#f59e0b',
        secondary: '#fbbf24',
        background: '#fffbeb',
        surface: '#fef3c7',
        text: '#92400e',
        textSecondary: '#b45309',
        border: '#fde68a',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      'mood-neutral': {
        primary: '#64748b',
        secondary: '#94a3b8',
        background: '#f8fafc',
        surface: '#f1f5f9',
        text: '#0f172a',
        textSecondary: '#475569',
        border: '#e2e8f0',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      'mood-stressed': {
        primary: '#ef4444',
        secondary: '#f87171',
        background: '#fef2f2',
        surface: '#fee2e2',
        text: '#7f1d1d',
        textSecondary: '#991b1b',
        border: '#fecaca',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      'mood-anxious': {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        background: '#eff6ff',
        surface: '#dbeafe',
        text: '#1e3a8a',
        textSecondary: '#1e40af',
        border: '#bfdbfe',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      'mood-calm': {
        primary: '#22c55e',
        secondary: '#4ade80',
        background: '#f0fdf4',
        surface: '#dcfce7',
        text: '#14532d',
        textSecondary: '#166534',
        border: '#bbf7d0',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    };

    return themeColors[effectiveTheme] || themeColors.light;
  };

  // Get mood-based theme class
  const getMoodThemeClass = (mood) => {
    const moodThemes = {
      happy: 'mood-happy',
      excited: 'mood-happy',
      content: 'mood-calm',
      calm: 'mood-calm',
      neutral: 'mood-neutral',
      worried: 'mood-anxious',
      anxious: 'mood-anxious',
      stressed: 'mood-stressed',
      sad: 'mood-stressed',
      angry: 'mood-stressed',
    };

    return moodThemes[mood] || 'mood-neutral';
  };

  // Context value
  const value = {
    // State
    theme: state.theme,
    moodTheme: state.moodTheme,
    adaptiveTheme: state.adaptiveTheme,
    systemTheme: state.systemTheme,
    
    // Actions
    setTheme,
    setMoodTheme,
    setAdaptiveTheme,
    toggleTheme,
    
    // Utilities
    getEffectiveTheme,
    getThemeColors,
    getMoodThemeClass,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;
