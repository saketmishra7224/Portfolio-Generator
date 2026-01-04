import React from 'react';

const EducationSection = ({ education, variant = 'detailed' }) => {
  if (variant === 'compact') {
    return (
      <div className="education-compact">
        <h3>{education.college}</h3>
        <p className="education-degree">{education.degree} in {education.specialization}</p>
        {education.cgpa && <p className="education-cgpa">CGPA: {education.cgpa}</p>}
        {education.summary && <p className="education-summary">{education.summary}</p>}
      </div>
    );
  }

  return (
    <div className="education-detailed">
      <div className="education-item">
        <label>College:</label>
        <p>{education.college}</p>
      </div>
      <div className="education-item">
        <label>Degree:</label>
        <p>{education.degree}</p>
      </div>
      <div className="education-item">
        <label>Specialization:</label>
        <p>{education.specialization}</p>
      </div>
      {education.cgpa && (
        <div className="education-item">
          <label>CGPA:</label>
          <p>{education.cgpa}</p>
        </div>
      )}
      {education.summary && (
        <div className="education-item">
          <label>Summary:</label>
          <p>{education.summary}</p>
        </div>
      )}
    </div>
  );
};

export default EducationSection;
