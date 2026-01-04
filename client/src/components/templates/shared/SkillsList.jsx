import React from 'react';

const SkillsList = ({ skills, variant = 'badges' }) => {
  if (variant === 'list') {
    return (
      <ul className="skills-list">
        {skills.map((skill, index) => (
          <li key={index}>{skill}</li>
        ))}
      </ul>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="skills-grid">
        {skills.map((skill, index) => (
          <div key={index} className="skill-grid-item">{skill}</div>
        ))}
      </div>
    );
  }

  // Default: badges
  return (
    <div className="skills-badges">
      {skills.map((skill, index) => (
        <span key={index} className="skill-badge">{skill}</span>
      ))}
    </div>
  );
};

export default SkillsList;
