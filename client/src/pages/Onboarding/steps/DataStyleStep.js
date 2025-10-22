import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, List, Eye, MousePointer } from 'lucide-react';
import Button from '../../../components/UI/Button';

const DataStyleStep = ({ onComplete, selectedValue, loading }) => {
  const [selectedStyle, setSelectedStyle] = useState(selectedValue);

  const dataStyles = [
    {
      id: 'visual',
      title: 'Visual Charts',
      description: 'I prefer colorful charts, graphs, and visual representations',
      icon: BarChart3,
      preview: '📊',
      features: ['Interactive charts', 'Colorful graphs', 'Visual trends', 'Easy to scan'],
    },
    {
      id: 'list',
      title: 'Clean Lists',
      description: 'I prefer organized lists and detailed breakdowns',
      icon: List,
      preview: '📋',
      features: ['Detailed tables', 'Organized lists', 'Clear categories', 'Easy to read'],
    },
  ];

  const handleSelect = (style) => {
    setSelectedStyle(style);
  };

  const handleContinue = () => {
    if (selectedStyle) {
      onComplete(selectedStyle);
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
        How would you like to see your financial data? This will customize your dashboard experience.
      </motion.p>

      {/* Options */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {dataStyles.map((style, index) => (
          <motion.div
            key={style.id}
            className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
              selectedStyle === style.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600'
            }`}
            onClick={() => handleSelect(style.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selection Indicator */}
            {selectedStyle === style.id && (
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
                selectedStyle === style.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              animate={{
                rotate: selectedStyle === style.id ? [0, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <style.icon className="w-8 h-8" />
            </motion.div>

            {/* Preview Emoji */}
            <motion.div
              className="text-4xl mb-4"
              animate={{
                scale: selectedStyle === style.id ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {style.preview}
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {style.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {style.description}
            </p>

            {/* Features */}
            <div className="space-y-2">
              {style.features.map((feature, featureIndex) => (
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
          disabled={!selectedStyle || loading}
          size="lg"
          className="px-8 py-4"
        >
          Continue
          <Eye className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Selection Preview */}
      {selectedStyle && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <MousePointer className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              You selected: <span className="font-semibold text-gray-900 dark:text-white">
                {dataStyles.find(s => s.id === selectedStyle)?.title}
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DataStyleStep;
