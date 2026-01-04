import React from 'react';
import { FaEnvelope, FaPhone, FaGithub } from 'react-icons/fa';

const ContactInfo = ({ personalInfo, socialLinks, variant = 'default' }) => {
  if (variant === 'header') {
    return (
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
    );
  }

  return (
    <div className="contact-info-section">
      <div className="contact-detail">
        <FaEnvelope className="contact-icon" />
        <span>{personalInfo.email}</span>
      </div>
      <div className="contact-detail">
        <FaPhone className="contact-icon" />
        <span>{personalInfo.phone}</span>
      </div>
      {socialLinks.github && (
        <div className="contact-detail">
          <FaGithub className="contact-icon" />
          <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
            GitHub Profile
          </a>
        </div>
      )}
    </div>
  );
};

export default ContactInfo;
