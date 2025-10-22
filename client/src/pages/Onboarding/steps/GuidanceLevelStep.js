import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Lightbulb, Target } from 'lucide-react';
import Button from '../../../components/UI/Button';

const GuidanceLevelStep = ({ onComplete, selectedValue, loading }) => {
  const [selectedLevel, setSelectedLevel] = useState(selectedValue);

  const guidanceLevels = [
    {
      id: 'copilot',
      title: 'Co-pilot Mode',
      description: 'I want FINE to actively guide me and provide regular insights',
      icon: Users,
      preview: '🤝',
      features: [
        'Daily insights and tips',
        'Proactive notifications',
        'Step-by-step guidance',
        'Regular check-ins'
      ],
      personality: 'Supportive and encouraging',
      frequency: 'High engagement',
    },
    {
      id: 'fly_solo',
      title: 'Fly Solo Mode',
      description: 'I prefer to explore on my own with minimal guidance',
      icon: User,
      preview: '🦅',
      features: [
        'Minimal notifications',
        'Self-service tools',
        'On-demand insights',
        'Quiet background support'
      ],
      personality: 'Respectful and unobtrusive',
      frequency: 'Low engagement',
    },
  ];

  const handleSelect = (level) => {
    setSelectedLevel(level);
  };

  const handleContinue = () => {
    if (selectedLevel) {
      onComplete(selectedLevel);
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
        How much guidance would you like from FINE? This affects how often we'll reach out with insights and tips.
      </motion.p>

      {/* Options */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {guidanceLevels.map((level, index) => (
          <motion.div
            key={level.id}
            className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
              selectedLevel === level.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600'
            }`}
            onClick={() => handleSelect(level.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selection Indicator */}
            {selectedLevel === level.id && (
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
                selectedLevel === level.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              animate={{
                rotate: selectedLevel === level.id ? [0, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <level.icon className="w-8 h-8" />
            </motion.div>

            {/* Preview Emoji */}
            <motion.div
              className="text-4xl mb-4"
              animate={{
                scale: selectedLevel === level.id ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {level.preview}
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {level.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {level.description}
            </p>

            {/* Features */}
            <div className="space-y-2 mb-4">
              {level.features.map((feature, featureIndex) => (
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
              <div className="flex items-center space-x-2 text-sm">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Personality:</span> {level.personality}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Frequency:</span> {level.frequency}
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
          disabled={!selectedLevel || loading}
          size="lg"
          className="px-8 py-4"
        >
          Continue
          <Target className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Selection Preview */}
      {selectedLevel && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              You selected: <span className="font-semibold text-gray-900 dark:text-white">
                {guidanceLevels.find(l => l.id === selectedLevel)?.title}
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GuidanceLevelStep;
