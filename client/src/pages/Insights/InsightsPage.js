import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMood } from '../../contexts/MoodContext';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

// Mock data for demonstration
const mockInsights = {
  emotionalProfile: {
    overallMood: 'positive',
    moodTrend: 'improving',
    stressLevel: 'low',
    emotionalStability: 'high',
    recentMoods: [
      { date: '2024-01-15', mood: 'happy', score: 8 },
      { date: '2024-01-14', mood: 'excited', score: 9 },
      { date: '2024-01-13', mood: 'neutral', score: 6 },
      { date: '2024-01-12', mood: 'happy', score: 7 },
      { date: '2024-01-11', mood: 'excited', score: 8 },
    ]
  },
  spendingPatterns: {
    totalSpent: 4200.75,
    averageDaily: 140.03,
    topCategories: [
      { category: 'Food', amount: 1250.50, percentage: 29.8, trend: 'increasing' },
      { category: 'Transportation', amount: 450.00, percentage: 10.7, trend: 'stable' },
      { category: 'Entertainment', amount: 320.00, percentage: 7.6, trend: 'decreasing' },
      { category: 'Health', amount: 280.00, percentage: 6.7, trend: 'stable' },
      { category: 'Shopping', amount: 890.25, percentage: 21.2, trend: 'increasing' },
    ],
    spendingTrend: 'increasing',
    budgetCompliance: 85
  },
  recommendations: [
    {
      id: 1,
      type: 'spending',
      priority: 'high',
      title: 'Reduce Dining Out Expenses',
      description: 'You\'re spending 40% more on dining out this month. Consider cooking at home more often.',
      impact: 'Could save $200-300 per month',
      action: 'Set a weekly dining budget of $50',
      sentiment: 'neutral'
    },
    {
      id: 2,
      type: 'savings',
      priority: 'medium',
      title: 'Increase Emergency Fund Contributions',
      description: 'Your emergency fund is at 75% of your target. Consider increasing monthly contributions.',
      impact: 'Reach your goal 2 months earlier',
      action: 'Increase monthly contribution by $200',
      sentiment: 'positive'
    },
    {
      id: 3,
      type: 'behavioral',
      priority: 'low',
      title: 'Weekend Spending Pattern',
      description: 'You tend to spend more on weekends. This might be affecting your weekly budget.',
      impact: 'Better budget distribution',
      action: 'Set weekend spending limits',
      sentiment: 'neutral'
    }
  ],
  forecasts: {
    nextMonthSpending: 4500.00,
    savingsProjection: 3800.00,
    goalAchievement: {
      emergencyFund: { target: 10000, projected: 8500, timeline: '3 months' },
      vacation: { target: 5000, projected: 4200, timeline: '2 months' },
      newCar: { target: 25000, projected: 12000, timeline: '8 months' }
    }
  },
  aiInsights: [
    {
      id: 1,
      type: 'pattern',
      message: 'Your spending increases by 25% on payday weekends. Consider setting up automatic savings transfers.',
      confidence: 0.85,
      sentiment: 'neutral'
    },
    {
      id: 2,
      type: 'emotional',
      message: 'You tend to spend more when feeling stressed. Your stress spending has increased by 15% this month.',
      confidence: 0.78,
      sentiment: 'concern'
    },
    {
      id: 3,
      type: 'positive',
      message: 'Great job! Your savings rate has improved by 12% compared to last month.',
      confidence: 0.92,
      sentiment: 'positive'
    },
    {
      id: 4,
      type: 'forecast',
      message: 'Based on current trends, you\'re on track to meet your emergency fund goal by March 2024.',
      confidence: 0.88,
      sentiment: 'positive'
    }
  ]
};

const InsightsPage = () => {
  const { user } = useAuth();
  const { currentMood } = useMood();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(mockInsights);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

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

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'text-green-600 bg-green-100',
      negative: 'text-red-600 bg-red-100',
      neutral: 'text-gray-600 bg-gray-100',
      concern: 'text-orange-600 bg-orange-100',
    };
    return colors[sentiment] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-green-600 bg-green-100',
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable':
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
              <p className="text-gray-600 mt-1">
                Personalized financial insights powered by AI
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100"
        >
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'emotional', label: 'Emotional Profile', icon: Brain },
              { id: 'spending', label: 'Spending Patterns', icon: PieChart },
              { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
              { id: 'forecasts', label: 'Forecasts', icon: LineChart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Overall Mood</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">
                      {insights.emotionalProfile.overallMood}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{getMoodEmoji(insights.emotionalProfile.overallMood)}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Trending {insights.emotionalProfile.moodTrend}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Monthly Spending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(insights.spendingPatterns.totalSpent)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-red-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-red-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Trending {insights.spendingPatterns.spendingTrend}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Budget Compliance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {insights.spendingPatterns.budgetCompliance}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Good compliance</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Insights</h2>
              <div className="space-y-4">
                {insights.aiInsights.map((insight) => (
                  <div key={insight.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 text-sm">🤖</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{insight.message}</p>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(insight.sentiment)}`}>
                            {insight.sentiment}
                          </span>
                          <span className="text-xs text-gray-500">
                            Confidence: {(insight.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {insight.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Emotional Profile Tab */}
        {activeTab === 'emotional' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Emotional Profile</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Overall Mood</span>
                    <span className="font-medium capitalize">{insights.emotionalProfile.overallMood}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mood Trend</span>
                    <span className="font-medium capitalize">{insights.emotionalProfile.moodTrend}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Stress Level</span>
                    <span className="font-medium capitalize">{insights.emotionalProfile.stressLevel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Emotional Stability</span>
                    <span className="font-medium capitalize">{insights.emotionalProfile.emotionalStability}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Moods</h2>
                <div className="space-y-3">
                  {insights.emotionalProfile.recentMoods.map((mood, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getMoodEmoji(mood.mood)}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(mood.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                            style={{ width: `${(mood.score / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{mood.score}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Spending Patterns Tab */}
        {activeTab === 'spending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h2>
              <div className="space-y-4">
                {insights.spendingPatterns.topCategories.map((category, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{category.category}</span>
                        {getTrendIcon(category.trend)}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(category.amount)}</p>
                        <p className="text-sm text-gray-600">{category.percentage}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {insights.recommendations.map((recommendation) => (
                <div key={recommendation.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{recommendation.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Impact</p>
                          <p className="text-sm text-gray-600">{recommendation.impact}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Recommended Action</p>
                          <p className="text-sm text-gray-600">{recommendation.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(recommendation.sentiment)}`}>
                      {recommendation.sentiment}
                    </span>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Forecasts Tab */}
        {activeTab === 'forecasts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Financial Forecasts</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Next Month Spending</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(insights.forecasts.nextMonthSpending)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Savings Projection</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(insights.forecasts.savingsProjection)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Goal Achievement</h2>
                <div className="space-y-4">
                  {Object.entries(insights.forecasts.goalAchievement).map(([goal, data]) => (
                    <div key={goal} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 capitalize">
                          {goal.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <span className="text-sm text-gray-600">{data.timeline}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          {formatCurrency(data.projected)} / {formatCurrency(data.target)}
                        </span>
                        <span className="text-sm font-medium">
                          {((data.projected / data.target) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                          style={{ width: `${Math.min((data.projected / data.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default InsightsPage;
