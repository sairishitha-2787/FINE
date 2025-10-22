import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMood } from '../../contexts/MoodContext';
import clsx from 'clsx';

const MoodPicker = ({
  onMoodSelect,
  selectedMood = null,
  showIntensity = true,
  showLabels = true,
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const { getMoodEmoji, getMoodColor, getMoodDescription } = useMood();
  const [hoveredMood, setHoveredMood] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState(5);

  const moods = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'excited', label: 'Excited', emoji: '🤩' },
    { id: 'content', label: 'Content', emoji: '😌' },
    { id: 'calm', label: 'Calm', emoji: '😌' },
    { id: 'neutral', label: 'Neutral', emoji: '😐' },
    { id: 'worried', label: 'Worried', emoji: '😟' },
    { id: 'anxious', label: 'Anxious', emoji: '😰' },
    { id: 'stressed', label: 'Stressed', emoji: '😫' },
    { id: 'sad', label: 'Sad', emoji: '😢' },
    { id: 'angry', label: 'Angry', emoji: '😠' },
  ];

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      mood: 'w-8 h-8 text-lg',
      label: 'text-xs',
    },
    md: {
      container: 'gap-3',
      mood: 'w-12 h-12 text-2xl',
      label: 'text-sm',
    },
    lg: {
      container: 'gap-4',
      mood: 'w-16 h-16 text-3xl',
      label: 'text-base',
    },
  };

  const handleMoodClick = (mood) => {
    if (!disabled) {
      onMoodSelect?.(mood, selectedIntensity);
    }
  };

  const handleIntensityChange = (intensity) => {
    setSelectedIntensity(intensity);
    if (selectedMood) {
      onMoodSelect?.(selectedMood, intensity);
    }
  };

  return (
    <div className={clsx('flex flex-col items-center space-y-4', className)}>
      {/* Mood Grid */}
      <div className={clsx('grid grid-cols-5 gap-2', sizeClasses[size].container)}>
        {moods.map((mood) => {
          const isSelected = selectedMood === mood.id;
          const isHovered = hoveredMood === mood.id;
          const moodColor = getMoodColor(mood.id);
          
          return (
            <motion.div
              key={mood.id}
              className={clsx(
                'flex flex-col items-center cursor-pointer group',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => handleMoodClick(mood.id)}
              onHoverStart={() => setHoveredMood(mood.id)}
              onHoverEnd={() => setHoveredMood(null)}
              whileHover={{ scale: disabled ? 1 : 1.1 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Mood Emoji */}
              <motion.div
                className={clsx(
                  'rounded-full flex items-center justify-center transition-all duration-200',
                  sizeClasses[size].mood,
                  isSelected && 'ring-2 ring-offset-2',
                  isHovered && !disabled && 'shadow-lg'
                )}
                style={{
                  backgroundColor: isSelected ? moodColor : 'transparent',
                  ringColor: isSelected ? moodColor : 'transparent',
                  boxShadow: isHovered && !disabled ? `0 0 20px ${moodColor}40` : 'none',
                }}
                animate={{
                  scale: isSelected ? 1.1 : 1,
                  rotate: isHovered && !disabled ? [0, -5, 5, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="select-none">{mood.emoji}</span>
              </motion.div>
              
              {/* Mood Label */}
              {showLabels && (
                <motion.span
                  className={clsx(
                    'mt-1 text-center font-medium transition-colors duration-200',
                    sizeClasses[size].label,
                    isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                  )}
                  animate={{
                    color: isSelected ? moodColor : undefined,
                  }}
                >
                  {mood.label}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Intensity Slider */}
      {showIntensity && selectedMood && (
        <motion.div
          className="w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Intensity
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedIntensity}/10
            </span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              value={selectedIntensity}
              onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              style={{
                background: `linear-gradient(to right, ${getMoodColor(selectedMood)} 0%, ${getMoodColor(selectedMood)} ${(selectedIntensity / 10) * 100}%, #e5e7eb ${(selectedIntensity / 10) * 100}%, #e5e7eb 100%)`,
              }}
              disabled={disabled}
            />
            
            {/* Intensity markers */}
            <div className="flex justify-between mt-1">
              {[1, 3, 5, 7, 10].map((value) => (
                <span
                  key={value}
                  className="text-xs text-gray-400 dark:text-gray-500"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Selected Mood Description */}
      <AnimatePresence>
        {selectedMood && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getMoodDescription(selectedMood)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodPicker;
