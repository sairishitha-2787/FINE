import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Create context
const MoodContext = createContext();

// Initial state
const initialState = {
  currentMood: null,
  moodHistory: [],
  moodStats: null,
  loading: false,
  error: null,
  lastMoodLog: null,
  weeklyMoodScore: null,
  moodTrends: null,
};

// Action types
const MOOD_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_CURRENT_MOOD: 'SET_CURRENT_MOOD',
  SET_MOOD_HISTORY: 'SET_MOOD_HISTORY',
  SET_MOOD_STATS: 'SET_MOOD_STATS',
  SET_LAST_MOOD_LOG: 'SET_LAST_MOOD_LOG',
  SET_WEEKLY_MOOD_SCORE: 'SET_WEEKLY_MOOD_SCORE',
  SET_MOOD_TRENDS: 'SET_MOOD_TRENDS',
  ADD_MOOD_LOG: 'ADD_MOOD_LOG',
  UPDATE_MOOD_LOG: 'UPDATE_MOOD_LOG',
  DELETE_MOOD_LOG: 'DELETE_MOOD_LOG',
};

// Reducer
const moodReducer = (state, action) => {
  switch (action.type) {
    case MOOD_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case MOOD_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case MOOD_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case MOOD_ACTIONS.SET_CURRENT_MOOD:
      return {
        ...state,
        currentMood: action.payload,
      };
    
    case MOOD_ACTIONS.SET_MOOD_HISTORY:
      return {
        ...state,
        moodHistory: action.payload,
      };
    
    case MOOD_ACTIONS.SET_MOOD_STATS:
      return {
        ...state,
        moodStats: action.payload,
      };
    
    case MOOD_ACTIONS.SET_LAST_MOOD_LOG:
      return {
        ...state,
        lastMoodLog: action.payload,
      };
    
    case MOOD_ACTIONS.SET_WEEKLY_MOOD_SCORE:
      return {
        ...state,
        weeklyMoodScore: action.payload,
      };
    
    case MOOD_ACTIONS.SET_MOOD_TRENDS:
      return {
        ...state,
        moodTrends: action.payload,
      };
    
    case MOOD_ACTIONS.ADD_MOOD_LOG:
      return {
        ...state,
        moodHistory: [action.payload, ...state.moodHistory],
        lastMoodLog: action.payload,
      };
    
    case MOOD_ACTIONS.UPDATE_MOOD_LOG:
      return {
        ...state,
        moodHistory: state.moodHistory.map(log =>
          log.id === action.payload.id ? action.payload : log
        ),
        lastMoodLog: state.lastMoodLog?.id === action.payload.id ? action.payload : state.lastMoodLog,
      };
    
    case MOOD_ACTIONS.DELETE_MOOD_LOG:
      return {
        ...state,
        moodHistory: state.moodHistory.filter(log => log.id !== action.payload),
        lastMoodLog: state.lastMoodLog?.id === action.payload ? null : state.lastMoodLog,
      };
    
    default:
      return state;
  }
};

// Mood provider component
export const MoodProvider = ({ children }) => {
  const [state, dispatch] = useReducer(moodReducer, initialState);

  // Log mood
  const logMood = async (moodData) => {
    try {
      dispatch({ type: MOOD_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.post('/api/moods', moodData);
      
      if (response.data.success) {
        const moodLog = response.data.data.moodLog;
        
        dispatch({
          type: MOOD_ACTIONS.ADD_MOOD_LOG,
          payload: moodLog,
        });
        
        dispatch({
          type: MOOD_ACTIONS.SET_CURRENT_MOOD,
          payload: moodLog.mood,
        });
        
        toast.success('Mood logged successfully!');
        return { success: true, moodLog };
      } else {
        throw new Error(response.data.message || 'Failed to log mood');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to log mood';
      
      dispatch({
        type: MOOD_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get mood history
  const getMoodHistory = async (params = {}) => {
    try {
      dispatch({ type: MOOD_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.get('/api/moods', { params });
      
      if (response.data.success) {
        const { moodLogs } = response.data.data;
        
        dispatch({
          type: MOOD_ACTIONS.SET_MOOD_HISTORY,
          payload: moodLogs,
        });
        
        // Set current mood from most recent log
        if (moodLogs.length > 0) {
          dispatch({
            type: MOOD_ACTIONS.SET_CURRENT_MOOD,
            payload: moodLogs[0].mood,
          });
          
          dispatch({
            type: MOOD_ACTIONS.SET_LAST_MOOD_LOG,
            payload: moodLogs[0],
          });
        }
        
        return { success: true, moodLogs };
      } else {
        throw new Error(response.data.message || 'Failed to fetch mood history');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch mood history';
      
      dispatch({
        type: MOOD_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Get mood trends
  const getMoodTrends = async (days = 30) => {
    try {
      dispatch({ type: MOOD_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.get('/api/moods/trends', { params: { days } });
      
      if (response.data.success) {
        const { trends, patterns, moodStats, weeklyScores } = response.data.data;
        
        dispatch({
          type: MOOD_ACTIONS.SET_MOOD_TRENDS,
          payload: { trends, patterns, moodStats, weeklyScores },
        });
        
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to fetch mood trends');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch mood trends';
      
      dispatch({
        type: MOOD_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Get mood summary
  const getMoodSummary = async (days = 7) => {
    try {
      dispatch({ type: MOOD_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.get('/api/moods/summary', { params: { days } });
      
      if (response.data.success) {
        const { summary, moodDistribution, recentMoods } = response.data.data;
        
        dispatch({
          type: MOOD_ACTIONS.SET_MOOD_STATS,
          payload: { summary, moodDistribution, recentMoods },
        });
        
        // Calculate weekly mood score
        if (summary.avgMoodScore) {
          dispatch({
            type: MOOD_ACTIONS.SET_WEEKLY_MOOD_SCORE,
            payload: summary.avgMoodScore,
          });
        }
        
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to fetch mood summary');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch mood summary';
      
      dispatch({
        type: MOOD_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Update mood log
  const updateMoodLog = async (id, moodData) => {
    try {
      dispatch({ type: MOOD_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.put(`/api/moods/${id}`, moodData);
      
      if (response.data.success) {
        const moodLog = response.data.data.moodLog;
        
        dispatch({
          type: MOOD_ACTIONS.UPDATE_MOOD_LOG,
          payload: moodLog,
        });
        
        toast.success('Mood updated successfully!');
        return { success: true, moodLog };
      } else {
        throw new Error(response.data.message || 'Failed to update mood');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update mood';
      
      dispatch({
        type: MOOD_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Delete mood log
  const deleteMoodLog = async (id) => {
    try {
      dispatch({ type: MOOD_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.delete(`/api/moods/${id}`);
      
      if (response.data.success) {
        dispatch({
          type: MOOD_ACTIONS.DELETE_MOOD_LOG,
          payload: id,
        });
        
        toast.success('Mood log deleted successfully!');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to delete mood');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete mood';
      
      dispatch({
        type: MOOD_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Set current mood (for UI state)
  const setCurrentMood = (mood) => {
    dispatch({
      type: MOOD_ACTIONS.SET_CURRENT_MOOD,
      payload: mood,
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: MOOD_ACTIONS.CLEAR_ERROR });
  };

  // Get mood emoji
  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      happy: '😊',
      excited: '🤩',
      content: '😌',
      calm: '😌',
      neutral: '😐',
      worried: '😟',
      anxious: '😰',
      stressed: '😫',
      sad: '😢',
      angry: '😠',
    };
    
    return moodEmojis[mood] || '😐';
  };

  // Get mood color
  const getMoodColor = (mood) => {
    const moodColors = {
      happy: '#f59e0b',
      excited: '#f59e0b',
      content: '#22c55e',
      calm: '#22c55e',
      neutral: '#64748b',
      worried: '#3b82f6',
      anxious: '#3b82f6',
      stressed: '#ef4444',
      sad: '#ef4444',
      angry: '#ef4444',
    };
    
    return moodColors[mood] || '#64748b';
  };

  // Get mood description
  const getMoodDescription = (mood) => {
    const moodDescriptions = {
      happy: 'Feeling joyful and positive',
      excited: 'Full of energy and enthusiasm',
      content: 'Peaceful and satisfied',
      calm: 'Relaxed and at ease',
      neutral: 'Balanced and steady',
      worried: 'Concerned about something',
      anxious: 'Feeling nervous or uneasy',
      stressed: 'Under pressure or overwhelmed',
      sad: 'Feeling down or melancholy',
      angry: 'Feeling frustrated or upset',
    };
    
    return moodDescriptions[mood] || 'Feeling balanced';
  };

  // Calculate mood score
  const calculateMoodScore = (mood, intensity) => {
    const moodScores = {
      happy: 9,
      excited: 8,
      content: 7,
      calm: 6,
      neutral: 5,
      worried: 4,
      anxious: 3,
      stressed: 2,
      sad: 2,
      angry: 1,
    };
    
    const baseScore = moodScores[mood] || 5;
    return baseScore * (intensity / 10);
  };

  // Context value
  const value = {
    // State
    currentMood: state.currentMood,
    moodHistory: state.moodHistory,
    moodStats: state.moodStats,
    loading: state.loading,
    error: state.error,
    lastMoodLog: state.lastMoodLog,
    weeklyMoodScore: state.weeklyMoodScore,
    moodTrends: state.moodTrends,
    
    // Actions
    logMood,
    getMoodHistory,
    getMoodTrends,
    getMoodSummary,
    updateMoodLog,
    deleteMoodLog,
    setCurrentMood,
    clearError,
    
    // Utilities
    getMoodEmoji,
    getMoodColor,
    getMoodDescription,
    calculateMoodScore,
  };

  return (
    <MoodContext.Provider value={value}>
      {children}
    </MoodContext.Provider>
  );
};

// Custom hook to use mood context
export const useMood = () => {
  const context = useContext(MoodContext);
  
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  
  return context;
};

export default MoodContext;
