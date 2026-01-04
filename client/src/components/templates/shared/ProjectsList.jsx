import React from 'react';

const ProjectsList = ({ projects, variant = 'detailed' }) => {
  if (variant === 'compact') {
    return (
      <div className="projects-compact">
        {projects.map((project, index) => (
          <div key={index} className="project-compact-item">
            <h4>{project.title}</h4>
            <p className="project-tech">{project.technologies}</p>
            <p className="project-desc">{project.description}</p>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
                View Project →
              </a>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="projects-detailed">
      {projects.map((project, index) => (
        <div key={index} className="project-detailed-item">
          <div className="project-header">
            <h3>{project.title}</h3>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link-btn">
                View Project
              </a>
            )}
          </div>
          <p className="project-technologies">
            <strong>Technologies:</strong> {project.technologies}
          </p>
          <p className="project-description">{project.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ProjectsList;
