import React from 'react';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PortfolioPDF = ({ formData, onBack }) => {
  const { personalInfo, education, skills, projects, socialLinks } = formData;

  const downloadPDF = async () => {
    try {
      const element = document.getElementById('portfolio-content');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'a4'
      });

      const imgWidth = 8.5;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0.5, 0.5, imgWidth, imgHeight);

      pdf.save(`${personalInfo.name}-portfolio.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    }
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