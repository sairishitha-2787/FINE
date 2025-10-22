import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Zap, Shield } from 'lucide-react';
import Button from '../../../components/UI/Button';

const WelcomeStep = ({ onComplete, loading }) => {
  const features = [
    {
      icon: Heart,
      title: 'Emotional Insights',
      description: 'Understand how your emotions affect your spending',
    },
    {
      icon: Zap,
      title: 'Smart Recommendations',
      description: 'Get personalized financial advice powered by AI',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and never shared',
    },
  ];

  const handleGetStarted = () => {
    onComplete('welcome');
  };

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We're excited to help you build a healthier relationship with your finances. 
          Let's personalize your experience in just a few quick steps.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="grid md:grid-cols-3 gap-6 mt-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mb-4"
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <feature.icon className="w-6 h-6 text-white" />
            </motion.div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Get Started Button */}
      <motion.div
        className="pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="px-8 py-4 text-lg"
          disabled={loading}
        >
          <span>Get Started</span>
          <Sparkles className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Fun Animation */}
      <motion.div
        className="flex justify-center space-x-2 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {['🎉', '💰', '📊', '🎯', '✨'].map((emoji, index) => (
          <motion.span
            key={emoji}
            className="text-2xl"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeStep;
