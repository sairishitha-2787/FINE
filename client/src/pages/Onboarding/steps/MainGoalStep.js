import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, PiggyBank, BarChart3, Compass } from 'lucide-react';
import Button from '../../../components/UI/Button';

const MainGoalStep = ({ onComplete, selectedValue, loading }) => {
  const [selectedGoal, setSelectedGoal] = useState(selectedValue);

  const goals = [
    {
      id: 'spending',
      title: 'Control Spending',
      description: 'I want to better understand and manage my spending habits',
      icon: DollarSign,
      preview: '💳',
      features: [
        'Track daily expenses',
        'Identify spending patterns',
        'Set spending limits',
        'Reduce impulse purchases'
      ],
      focus: 'Expense management',
      timeframe: 'Daily tracking',
    },
    {
      id: 'saving',
      title: 'Build Savings',
      description: 'I want to save more money and build my emergency fund',
      icon: PiggyBank,
      preview: '💰',
      features: [
        'Set savings goals',
        'Track progress',
        'Find saving opportunities',
        'Build emergency fund'
      ],
      focus: 'Wealth building',
      timeframe: 'Monthly goals',
    },
    {
      id: 'budgeting',
      title: 'Master Budgeting',
      description: 'I want to create and stick to a realistic budget',
      icon: BarChart3,
      preview: '📊',
      features: [
        'Create budgets',
        'Track budget performance',
        'Adjust spending categories',
        'Stay on track'
      ],
      focus: 'Financial planning',
      timeframe: 'Monthly planning',
    },
    {
      id: 'exploring',
      title: 'Explore & Learn',
      description: 'I want to understand my financial habits and learn more',
      icon: Compass,
      preview: '🧭',
      features: [
        'Discover patterns',
        'Learn about finances',
        'Get insights',
        'Build awareness'
      ],
      focus: 'Financial education',
      timeframe: 'Ongoing learning',
    },
  ];

  const handleSelect = (goal) => {
    setSelectedGoal(goal);
  };

  const handleContinue = () => {
    if (selectedGoal) {
      onComplete(selectedGoal);
    }
  };

  return (
    <div className="space-y-8">
      {/* Description */}
      <motion.p
        className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        What's your main financial goal right now? This helps us personalize your experience and recommendations.
      </motion.p>

      {/* Options Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
              selectedGoal === goal.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600'
            }`}
            onClick={() => handleSelect(goal.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selection Indicator */}
            {selectedGoal === goal.id && (
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="w-3 h-3 bg-white rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </motion.div>
            )}

            {/* Icon */}
            <motion.div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                selectedGoal === goal.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              animate={{
                rotate: selectedGoal === goal.id ? [0, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <goal.icon className="w-8 h-8" />
            </motion.div>

            {/* Preview Emoji */}
            <motion.div
              className="text-4xl mb-4"
              animate={{
                scale: selectedGoal === goal.id ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {goal.preview}
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {goal.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {goal.description}
            </p>

            {/* Features */}
            <div className="space-y-2 mb-4">
              {goal.features.map((feature, featureIndex) => (
                <motion.div
                  key={feature}
                  className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + featureIndex * 0.1 }}
                >
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Focus:</span> {goal.focus}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Timeframe:</span> {goal.timeframe}
                </span>
              </div>
            </div>

            {/* Hover Effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10 opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Continue Button */}
      <motion.div
        className="flex justify-center pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Button
          onClick={handleContinue}
          disabled={!selectedGoal || loading}
          size="lg"
          className="px-8 py-4"
        >
          Continue
          <BarChart3 className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Selection Preview */}
      {selectedGoal && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Your goal: <span className="font-semibold text-gray-900 dark:text-white">
                {goals.find(g => g.id === selectedGoal)?.title}
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MainGoalStep;
