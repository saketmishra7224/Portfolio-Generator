import React from 'react';
import { FaArrowLeft, FaDownload, FaEnvelope, FaPhone, FaGithub } from 'react-icons/fa';
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
      <div id="portfolio-content" className="portfolio-content">
        {/* Header Section */}
        <div className="portfolio-header">
          <h1 className="portfolio-name">{personalInfo.name}</h1>
          <p className="portfolio-title">{education.degree}</p>
          <div className="portfolio-contact">
            <div className="contact-item">
              <FaEnvelope /> {personalInfo.email}
            </div>
            <div className="contact-item">
              <FaPhone /> {personalInfo.phone}
            </div>
            {socialLinks.github && (
              <div className="contact-item">
                <FaGithub /> <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Education Section */}
        <div className="portfolio-section">
          <h2>Education</h2>
          <div className="pdf-education">
            <h3>{education.college}</h3>
            <p>{education.degree} in {education.specialization}</p>
            <p>CGPA: {education.cgpa}</p>
            <p>{education.summary}</p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="portfolio-section">
          <h2>Skills</h2>
          <div className="pdf-skills-list">
            {skills.map((skill, index) => (
              <span key={index} className="pdf-skill-item">{skill}</span>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="portfolio-section">
          <h2>Projects</h2>
          {projects.map((project, index) => (
            <div key={index} className="pdf-project-item">
              <h3 className="pdf-project-title">{project.title}</h3>
              <p className="pdf-project-tech">{project.technologies}</p>
              <p className="pdf-project-desc">{project.description}</p>
              {project.link && (
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="pdf-project-link">
                  View Project
                </a>
              )}
            </div>
          ))}
        </div>
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