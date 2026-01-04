import React from 'react';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../context/ThemeContext';
import MinimalTemplate from './templates/MinimalTemplate';
import ModernTemplate from './templates/ModernTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import ProfessionalTemplate from './templates/ProfessionalTemplate';

const PortfolioPDF = ({ formData, onBack }) => {
  const { personalInfo } = formData;
  const { theme } = useTheme();

  // Set CSS variables dynamically based on theme
  const themeStyles = {
    '--accent-color': theme.accentColor || '#2563eb',
    '--font-family': theme.font || 'Inter',
    '--heading-color': theme.accentColor || '#2563eb'
  };

  const downloadPDF = () => {
    const element = document.getElementById('portfolio-content');
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `${personalInfo.name}-portfolio.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  // Render the appropriate template based on theme.template
  const renderTemplate = () => {
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
      <div id="portfolio-content" className="portfolio-content" style={themeStyles}>
        {renderTemplate()}
      </div>

      <div className="pdf-actions">
        <button onClick={onBack} className="pdf-btn back">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <button onClick={downloadPDF} className="pdf-btn download">
          <FaDownload /> Download PDF
        </button>
      </div>
    </div>
  );
};

export default PortfolioPDF; 