import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useMood } from '../../contexts/MoodContext';
import { CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// Onboarding steps
import DataStyleStep from './steps/DataStyleStep';
import GuidanceLevelStep from './steps/GuidanceLevelStep';
import MainGoalStep from './steps/MainGoalStep';
import AppPersonalityStep from './steps/AppPersonalityStep';
import WelcomeStep from './steps/WelcomeStep';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const { setMoodTheme } = useTheme();
  const { setCurrentMood } = useMood();

  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    data_style: null,
    guidance_level: null,
    main_goal: null,
    app_personality: null,
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to FINE!',
      component: WelcomeStep,
      progress: 0,
    },
    {
      id: 'data_style',
      title: 'How do you prefer to see your data?',
      component: DataStyleStep,
      progress: 20,
    },
    {
      id: 'guidance_level',
      title: 'What level of guidance do you prefer?',
      component: GuidanceLevelStep,
      progress: 40,
    },
    {
      id: 'main_goal',
      title: 'What\'s your main financial goal?',
      component: MainGoalStep,
      progress: 60,
    },
    {
      id: 'app_personality',
      title: 'How would you like FINE to communicate with you?',
      component: AppPersonalityStep,
      progress: 80,
    },
  ];

  // Redirect if user has already completed onboarding
  useEffect(() => {
    if (user?.onboarding_completed) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleStepComplete = (stepId, data) => {
    setOnboardingData(prev => ({
      ...prev,
      [stepId]: data,
    }));

    // Move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      handleCompleteOnboarding();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    
    try {
      const result = await completeOnboarding(onboardingData);
      
      if (result.success) {
        // Set initial mood theme
        setMoodTheme('neutral');
        setCurrentMood('neutral');
        
        // Show success animation
        toast.success('Welcome to FINE! 🎉');
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;
  const progress = currentStepData.progress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.header
          className="px-6 py-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FINE
              </span>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </motion.header>

        {/* Progress Bar */}
        <motion.div
          className="px-6 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <motion.div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-center"
              >
                <motion.h1
                  className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {currentStepData.title}
                </motion.h1>

                <motion.div
                  className="max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <StepComponent
                    onComplete={(data) => handleStepComplete(currentStepData.id, data)}
                    onPrevious={currentStep > 0 ? handlePreviousStep : null}
                    selectedValue={onboardingData[currentStepData.id]}
                    loading={loading}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Navigation */}
        <motion.footer
          className="px-6 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <motion.button
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: currentStep > 0 ? 1.05 : 1 }}
              whileTap={{ scale: currentStep > 0 ? 0.95 : 1 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </motion.button>

            <div className="flex items-center space-x-2">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index <= currentStep
                      ? 'bg-primary-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  animate={{
                    scale: index === currentStep ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </motion.footer>
      </div>

      {/* Completion Animation */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to FINE!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Setting up your personalized experience...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingPage;
