import React from 'react';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import html2pdf from 'html2pdf.js';

const PortfolioPDF = ({ formData, onBack }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

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

  return (
    <div className="portfolio-pdf-container">
      <div className="portfolio-pdf-actions">
        <button onClick={onBack} className="back-btn">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <button onClick={downloadPDF} className="download-pdf-btn">
          <FaDownload /> Download PDF
        </button>
      </div>

      <div id="portfolio-content" className="portfolio-pdf-content">
        {/* Header Section */}
        <div className="pdf-header">
          <h1>{personalInfo.name}</h1>
          <p className="pdf-title">{education.degree}</p>
          <div className="pdf-contact-info">
            <span>{personalInfo.email}</span>
            <span>{personalInfo.phone}</span>
            {socialLinks.github && (
              <span>
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
                  GitHub Profile
                </a>
              </span>
            )}
          </div>
        </div>

        {/* Education Section */}
        <div className="pdf-section">
          <h2>Education</h2>
          <div className="pdf-education">
            <div className="pdf-education-header">
              <h3>{education.degree}</h3>
              <p className="pdf-degree">{education.college}</p>
            </div>
            <p className="pdf-description">
              <strong>Specialization:</strong> {education.specialization}<br />
              <strong>CGPA:</strong> {education.cgpa}
            </p>
            <p className="pdf-description">{education.summary}</p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="pdf-section">
          <h2>Skills</h2>
          <div className="pdf-skills">
            {skills.map((skill, index) => (
              <span key={index} className="pdf-skill">{skill}</span>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="pdf-section">
          <h2>Projects</h2>
          {projects.map((project, index) => (
            <div key={index} className="pdf-project">
              <div className="pdf-project-header">
                <h3>{project.title}</h3>
                <p className="pdf-technologies">{project.technologies}</p>
              </div>
              <p className="pdf-description">{project.description}</p>
              {project.link && (
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="pdf-link">
                  View Project
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPDF; 