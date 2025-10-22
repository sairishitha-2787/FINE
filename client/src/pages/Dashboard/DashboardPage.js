import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calendar,
  Plus,
  Filter,
  Search,
  Bell,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMood } from '../../contexts/MoodContext';
import { useTheme } from '../../contexts/ThemeContext';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/UI/Button';
import MoodPicker from '../../components/UI/MoodPicker';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

// Mock data for demonstration
const mockData = {
  balance: 12500.50,
  monthlyIncome: 8500.00,
  monthlyExpenses: 4200.75,
  savings: 4300.25,
  goals: [
    { id: 1, name: 'Emergency Fund', target: 10000, current: 7500, deadline: '2024-12-31' },
    { id: 2, name: 'Vacation', target: 5000, current: 3200, deadline: '2024-08-15' },
    { id: 3, name: 'New Car', target: 25000, current: 8500, deadline: '2025-06-30' },
  ],
  recentTransactions: [
    { id: 1, description: 'Grocery Shopping', amount: -125.50, category: 'Food', date: '2024-01-15', mood: 'neutral' },
    { id: 2, description: 'Salary', amount: 4250.00, category: 'Income', date: '2024-01-14', mood: 'happy' },
    { id: 3, description: 'Coffee', amount: -4.50, category: 'Food', date: '2024-01-14', mood: 'happy' },
    { id: 4, description: 'Gas', amount: -45.00, category: 'Transportation', date: '2024-01-13', mood: 'neutral' },
    { id: 5, description: 'Movie Tickets', amount: -28.00, category: 'Entertainment', date: '2024-01-12', mood: 'excited' },
  ],
  insights: [
    { id: 1, type: 'spending', message: 'You spent 15% more on dining this week compared to last week.', sentiment: 'neutral' },
    { id: 2, type: 'savings', message: 'Great job! You\'re on track to meet your emergency fund goal.', sentiment: 'positive' },
    { id: 3, type: 'pattern', message: 'Your spending tends to increase on weekends. Consider setting a weekend budget.', sentiment: 'neutral' },
  ],
  weeklyMood: [
    { day: 'Mon', mood: 'happy', score: 8 },
    { day: 'Tue', mood: 'neutral', score: 6 },
    { day: 'Wed', mood: 'excited', score: 9 },
    { day: 'Thu', mood: 'happy', score: 7 },
    { day: 'Fri', mood: 'excited', score: 8 },
    { day: 'Sat', mood: 'happy', score: 9 },
    { day: 'Sun', mood: 'neutral', score: 6 },
  ],
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { currentMood, setCurrentMood } = useMood();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(mockData);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      happy: '😊',
      excited: '🤩',
      neutral: '😐',
      sad: '😢',
      stressed: '😰',
      angry: '😠',
    };
    return moodEmojis[mood] || '😐';
  };

  const getMoodColor = (mood) => {
    const moodColors = {
      happy: 'text-green-500',
      excited: 'text-yellow-500',
      neutral: 'text-gray-500',
      sad: 'text-blue-500',
      stressed: 'text-orange-500',
      angry: 'text-red-500',
    };
    return moodColors[mood] || 'text-gray-500';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's your financial overview for today
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoodPicker(true)}
                className="flex items-center space-x-2"
              >
                <span className="text-lg">{getMoodEmoji(currentMood)}</span>
                <span>Update Mood</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Financial Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Total Balance */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-medium">Total Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(data.balance)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary-200" />
            </div>
            <div className="mt-4 flex items-center text-primary-100">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">+2.5% from last month</span>
            </div>
          </div>

          {/* Monthly Income */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Monthly Income</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.monthlyIncome)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4 flex items-center text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">+5.2% from last month</span>
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Monthly Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.monthlyExpenses)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
            <div className="mt-4 flex items-center text-red-600">
              <TrendingDown className="w-4 h-4 mr-1" />
              <span className="text-sm">-1.8% from last month</span>
            </div>
          </div>

          {/* Savings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Savings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.savings)}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4 flex items-center text-blue-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">+8.1% from last month</span>
            </div>
          </div>
        </motion.div>

        {/* Goals and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Goals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Financial Goals</h2>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
            <div className="space-y-4">
              {data.goals.map((goal) => {
                const progress = (goal.current / goal.target) * 100;
                return (
                  <div key={goal.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{goal.name}</h3>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{progress.toFixed(1)}% complete</span>
                      <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <div className="space-y-3">
              {data.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getMoodEmoji(transaction.mood)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Insights and Weekly Mood */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Insights</h2>
            <div className="space-y-4">
              {data.insights.map((insight) => (
                <div key={insight.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 text-sm">💡</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{insight.message}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          insight.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {insight.sentiment}
                        </span>
                        <span className="text-xs text-gray-500">{insight.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Mood Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Mood</h2>
            <div className="space-y-4">
              {data.weeklyMood.map((day) => (
                <div key={day.day} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 w-8">{day.day}</span>
                    <span className="text-lg">{getMoodEmoji(day.mood)}</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(day.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{day.score}/10</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mood Picker Modal */}
      {showMoodPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How are you feeling today?</h3>
            <MoodPicker
              currentMood={currentMood}
              onMoodSelect={(mood) => {
                setCurrentMood(mood);
                setShowMoodPicker(false);
              }}
            />
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowMoodPicker(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;
