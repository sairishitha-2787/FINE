import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, MessageSquare, Sparkles, Zap } from 'lucide-react';
import Button from '../../../components/UI/Button';

const AppPersonalityStep = ({ onComplete, selectedValue, loading }) => {
  const [selectedPersonality, setSelectedPersonality] = useState(selectedValue);

  const personalities = [
    {
      id: 'playful',
      title: 'Playful & Positive',
      description: 'I want FINE to be encouraging, fun, and use emojis and positive language',
      icon: Smile,
      preview: '😊',
      features: [
        'Encouraging messages',
        'Fun emojis and animations',
        'Positive reinforcement',
        'Celebration of wins'
      ],
      tone: 'Upbeat and supportive',
      examples: [
        '🎉 Great job staying under budget this week!',
        '💪 You\'re doing amazing with your savings goal!',
        '✨ Your spending habits are improving!'
      ],
    },
    {
      id: 'direct',
      title: 'Clear & Direct',
      description: 'I prefer straightforward, professional communication without fluff',
      icon: MessageSquare,
      preview: '📋',
      features: [
        'Clear, concise messages',
        'Professional tone',
        'Factual insights',
        'Direct recommendations'
      ],
      tone: 'Professional and clear',
      examples: [
        'Budget exceeded by $150 this month.',
        'Savings goal: 75% complete.',
        'Spending increased 12% from last month.'
      ],
    },
  ];

  const handleSelect = (personality) => {
    setSelectedPersonality(personality);
  };

  const handleContinue = () => {
    if (selectedPersonality) {
      onComplete(selectedPersonality);
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
        How would you like FINE to communicate with you? This affects the tone and style of all messages and insights.
      </motion.p>

      {/* Options */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {personalities.map((personality, index) => (
          <motion.div
            key={personality.id}
            className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
              selectedPersonality === personality.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600'
            }`}
            onClick={() => handleSelect(personality.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selection Indicator */}
            {selectedPersonality === personality.id && (
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
                selectedPersonality === personality.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              animate={{
                rotate: selectedPersonality === personality.id ? [0, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <personality.icon className="w-8 h-8" />
            </motion.div>

            {/* Preview Emoji */}
            <motion.div
              className="text-4xl mb-4"
              animate={{
                scale: selectedPersonality === personality.id ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {personality.preview}
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {personality.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {personality.description}
            </p>

            {/* Features */}
            <div className="space-y-2 mb-4">
              {personality.features.map((feature, featureIndex) => (
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

            {/* Tone */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tone: {personality.tone}
                </span>
              </div>
            </div>

            {/* Example Messages */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Example messages:
              </h4>
              {personality.examples.map((example, exampleIndex) => (
                <motion.div
                  key={example}
                  className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + exampleIndex * 0.1 }}
                >
                  "{example}"
                </motion.div>
              ))}
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
          disabled={!selectedPersonality || loading}
          size="lg"
          className="px-8 py-4"
        >
          Complete Setup
          <Sparkles className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Selection Preview */}
      {selectedPersonality && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Communication style: <span className="font-semibold text-gray-900 dark:text-white">
                {personalities.find(p => p.id === selectedPersonality)?.title}
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AppPersonalityStep;
