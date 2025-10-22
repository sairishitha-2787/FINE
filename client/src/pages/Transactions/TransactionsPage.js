import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMood } from '../../contexts/MoodContext';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/UI/Button';
import MoodPicker from '../../components/UI/MoodPicker';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

// Mock data for demonstration
const mockTransactions = [
  { 
    id: 1, 
    description: 'Grocery Shopping', 
    amount: -125.50, 
    category: 'Food', 
    date: '2024-01-15', 
    mood: 'neutral',
    notes: 'Weekly grocery shopping at Whole Foods',
    tags: ['groceries', 'weekly']
  },
  { 
    id: 2, 
    description: 'Salary', 
    amount: 4250.00, 
    category: 'Income', 
    date: '2024-01-14', 
    mood: 'happy',
    notes: 'Monthly salary payment',
    tags: ['salary', 'monthly']
  },
  { 
    id: 3, 
    description: 'Coffee', 
    amount: -4.50, 
    category: 'Food', 
    date: '2024-01-14', 
    mood: 'happy',
    notes: 'Morning coffee at local café',
    tags: ['coffee', 'daily']
  },
  { 
    id: 4, 
    description: 'Gas', 
    amount: -45.00, 
    category: 'Transportation', 
    date: '2024-01-13', 
    mood: 'neutral',
    notes: 'Gas station fill-up',
    tags: ['gas', 'transportation']
  },
  { 
    id: 5, 
    description: 'Movie Tickets', 
    amount: -28.00, 
    category: 'Entertainment', 
    date: '2024-01-12', 
    mood: 'excited',
    notes: 'Movie night with friends',
    tags: ['entertainment', 'social']
  },
  { 
    id: 6, 
    description: 'Gym Membership', 
    amount: -49.99, 
    category: 'Health', 
    date: '2024-01-10', 
    mood: 'happy',
    notes: 'Monthly gym membership',
    tags: ['health', 'monthly']
  },
  { 
    id: 7, 
    description: 'Online Shopping', 
    amount: -89.99, 
    category: 'Shopping', 
    date: '2024-01-09', 
    mood: 'excited',
    notes: 'New clothes from online store',
    tags: ['shopping', 'clothes']
  },
  { 
    id: 8, 
    description: 'Freelance Work', 
    amount: 500.00, 
    category: 'Income', 
    date: '2024-01-08', 
    mood: 'happy',
    notes: 'Freelance web development project',
    tags: ['freelance', 'work']
  },
];

const categories = [
  'All', 'Food', 'Transportation', 'Entertainment', 'Health', 'Shopping', 'Income', 'Bills', 'Other'
];

const moods = [
  'All', 'happy', 'excited', 'neutral', 'sad', 'stressed', 'angry'
];

const TransactionsPage = () => {
  const { user } = useAuth();
  const { currentMood } = useMood();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMood, setSelectedMood] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showAmounts, setShowAmounts] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Filter transactions based on search term, category, and mood
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(transaction => transaction.category === selectedCategory);
    }

    if (selectedMood !== 'All') {
      filtered = filtered.filter(transaction => transaction.mood === selectedMood);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, selectedCategory, selectedMood]);

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

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      Food: '🍽️',
      Transportation: '🚗',
      Entertainment: '🎬',
      Health: '🏥',
      Shopping: '🛍️',
      Income: '💰',
      Bills: '📄',
      Other: '📝',
    };
    return categoryIcons[category] || '📝';
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      Food: 'bg-orange-100 text-orange-800',
      Transportation: 'bg-blue-100 text-blue-800',
      Entertainment: 'bg-purple-100 text-purple-800',
      Health: 'bg-green-100 text-green-800',
      Shopping: 'bg-pink-100 text-pink-800',
      Income: 'bg-emerald-100 text-emerald-800',
      Bills: 'bg-red-100 text-red-800',
      Other: 'bg-gray-100 text-gray-800',
    };
    return categoryColors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDeleteTransaction = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(transactions.filter(t => t.id !== transactionId));
    }
  };

  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netAmount = totalIncome - totalExpenses;

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
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600 mt-1">
                Manage and track your financial transactions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAmounts(!showAmounts)}
                className="flex items-center space-x-2"
              >
                {showAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showAmounts ? 'Hide' : 'Show'} Amounts</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Transaction</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {showAmounts ? formatCurrency(totalIncome) : '••••••'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {showAmounts ? formatCurrency(totalExpenses) : '••••••'}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Net Amount</p>
                <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {showAmounts ? formatCurrency(netAmount) : '••••••'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Search transactions..."
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Mood Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mood
                </label>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {moods.map(mood => (
                    <option key={mood} value={mood}>
                      {mood === 'All' ? 'All Moods' : `${getMoodEmoji(mood)} ${mood}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions ({filteredTransactions.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">{getCategoryIcon(transaction.category)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(transaction.category)}`}>
                          {transaction.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                        <span className="text-lg">{getMoodEmoji(transaction.mood)}</span>
                      </div>
                      {transaction.notes && (
                        <p className="text-sm text-gray-600 mt-1">{transaction.notes}</p>
                      )}
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {transaction.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`font-semibold text-lg ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {showAmounts ? formatCurrency(transaction.amount) : '••••'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== 'All' || selectedMood !== 'All'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start by adding your first transaction.'}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Transaction</h3>
            <p className="text-gray-600 mb-4">
              This feature will be implemented in the next phase.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowAddModal(false)}>
                Add Transaction
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Transaction</h3>
            <p className="text-gray-600 mb-4">
              This feature will be implemented in the next phase.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowEditModal(false)}>
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default TransactionsPage;
