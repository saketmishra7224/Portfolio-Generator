import React from 'react';
import { FaCheckCircle, FaFileAlt, FaTachometerAlt } from 'react-icons/fa';

const Success = ({ formData, onViewPortfolio, onDashboard }) => {
  return (
    <div className="success-container">
      <div className="success-content">
        <FaCheckCircle className="success-icon" />
        <h1>Portfolio Created Successfully!</h1>
        <p>
          Congratulations {formData.personalInfo.name}! Your portfolio has been created successfully. 
          You can now view your portfolio or go to your dashboard to manage it.
        </p>
        <div className="success-actions">
          <button 
            onClick={onViewPortfolio} 
            className="success-btn view-portfolio-btn"
          >
            <FaFileAlt /> View Portfolio
          </button>
          <button 
            onClick={onDashboard} 
            className="success-btn dashboard-btn"
          >
            <FaTachometerAlt /> Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success; 