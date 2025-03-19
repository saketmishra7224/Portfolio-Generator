import React from 'react';

const SuccessPage = ({ onViewPortfolio, onDashboard }) => {
  return (
    <div className="auth-container" style={{ maxWidth: '800px' }}>
      <div className="auth-form p-8 w-full" style={{ maxWidth: '100%' }}>
        <div className="success-icon mb-6">
          <svg 
            className="w-20 h-20 mx-auto text-green-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Success!</h2>
        <p className="text-xl text-gray-600 mb-6">Your portfolio has been created successfully.</p>
        <p className="text-gray-600 mb-8">
          You can now showcase your skills and experience to potential employers or clients.
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={onViewPortfolio}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
          >
            View Your Portfolio
          </button>
          
          <button
            onClick={onDashboard}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage; 