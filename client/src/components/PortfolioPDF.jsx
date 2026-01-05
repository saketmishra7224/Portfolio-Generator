import React, { useState } from 'react';
import { FaArrowLeft, FaDownload, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../context/ThemeContext';
import MinimalTemplate from './templates/MinimalTemplate';
import ModernTemplate from './templates/ModernTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import ProfessionalTemplate from './templates/ProfessionalTemplate';
import ATSTemplate from './templates/ATSTemplate';

const PortfolioPDF = ({ formData, onBack }) => {
  const { personalInfo, skills, projects, education } = formData;
  const { theme } = useTheme();
  const [atsMode, setAtsMode] = useState(false);

  // Validate ATS requirements
  const validateATSRequirements = () => {
    const warnings = [];
    
    if (!personalInfo.bio && !personalInfo.tagline && !education.summary) {
      warnings.push('Professional summary is missing. Add a bio or tagline for better ATS results.');
    }
    
    if (!skills || skills.length === 0) {
      warnings.push('Skills section is empty. Add your technical skills for better ATS matching.');
    }
    
    if (!projects || projects.length === 0) {
      warnings.push('No projects added. Include relevant projects to showcase your work.');
    } else {
      const shortProjects = projects.filter(p => !p.description || p.description.length < 50);
      if (shortProjects.length > 0) {
        warnings.push(`${shortProjects.length} project(s) have short descriptions. Add detailed descriptions for better ATS results.`);
      }
    }
    
    return warnings;
  };

  const atsWarnings = validateATSRequirements();

  // Set CSS variables dynamically based on theme
  const themeStyles = atsMode ? {
    '--accent-color': '#000000',
    '--font-family': 'Arial, sans-serif',
    '--heading-color': '#000000'
  } : {
    '--accent-color': theme.accentColor || '#2563eb',
    '--font-family': theme.font || 'Inter',
    '--heading-color': theme.accentColor || '#2563eb'
  };

  const downloadPDF = () => {
    const element = document.getElementById('portfolio-content');
    const opt = {
      margin:       atsMode ? [0.3, 0.3, 0.3, 0.3] : [0.5, 0.5, 0.5, 0.5],
      filename:     `${personalInfo.name}-portfolio${atsMode ? '-ATS' : ''}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  // Render the appropriate template based on ATS mode or theme
  const renderTemplate = () => {
    if (atsMode) {
      return <ATSTemplate formData={formData} />;
    }
    
    const templateProps = { formData, themeStyles };
    
    switch (theme.template) {
      case 'modern':
        return <ModernTemplate {...templateProps} />;
      case 'classic':
        return <ClassicTemplate {...templateProps} />;
      case 'professional':
        return <ProfessionalTemplate {...templateProps} />;
      case 'minimal':
      default:
        return <MinimalTemplate {...templateProps} />;
    }
  };

  return (
    <div className="portfolio-pdf-container" style={themeStyles}>
      {/* ATS Mode Toggle and Warnings */}
      <div className="ats-controls">
        <div className="ats-toggle-container">
          <label className="ats-toggle-label">
            <input
              type="checkbox"
              checked={atsMode}
              onChange={(e) => setAtsMode(e.target.checked)}
              className="ats-toggle-input"
            />
            <span className="ats-toggle-switch"></span>
            <span className="ats-toggle-text">
              <strong>ATS Mode</strong>
            </span>
          </label>
        </div>

        {atsWarnings.length > 0 && (
          <div className="ats-warnings-box">
            <FaExclamationTriangle className="ats-warning-icon" />
            <div className="ats-warnings-content">
              <strong>ATS Optimization Suggestions:</strong>
              <ul>
                {atsWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div id="portfolio-content" className={`portfolio-content ${atsMode ? 'ats-mode' : ''}`} style={themeStyles}>
        {renderTemplate()}
      </div>

      <div className="pdf-actions">
        <button onClick={onBack} className="pdf-btn back">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <button onClick={downloadPDF} className="pdf-btn download">
          <FaDownload /> Download {atsMode ? 'ATS-Optimized ' : ''}PDF
        </button>
      </div>
    </div>
  );
};

export default PortfolioPDF; 