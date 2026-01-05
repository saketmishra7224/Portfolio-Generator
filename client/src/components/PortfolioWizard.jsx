import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

const PortfolioWizard = ({ currentStep, totalSteps, stepTitles, children, onNext, onPrev, onSave }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Progress Indicator */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      step < currentStep
                        ? 'bg-green-500 text-white'
                        : step === currentStep
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {step < currentStep ? <FaCheck /> : step}
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium hidden md:block ${
                      step === currentStep
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {stepTitles[index]}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${
                      step < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile Step Title */}
          <div className="md:hidden text-center">
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {stepTitles[currentStep - 1]}
            </p>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={currentStep}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6"
        >
          {children}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onPrev}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentStep === 1
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Previous
          </button>

          <div className="flex gap-3">
            {onSave && (
              <button
                onClick={onSave}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200"
              >
                Save Draft
              </button>
            )}
            <button
              onClick={onNext}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {currentStep === totalSteps ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioWizard;
