import React, { useState } from 'react';
import { FaPalette, FaFont, FaFileAlt, FaSave } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const ThemeCustomizer = () => {
  const { theme, updateThemeWithSync } = useTheme();
  const [localTheme, setLocalTheme] = useState(theme);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Available templates
  const templates = [
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple design' },
    { id: 'modern', name: 'Modern', description: 'Contemporary and sleek' },
    { id: 'classic', name: 'Classic', description: 'Traditional and professional' },
    { id: 'professional', name: 'Professional', description: 'Corporate and formal' }
  ];

  // Available fonts
  const fonts = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times New Roman' }
  ];

  // Preset colors
  const presetColors = [
    '#2563eb', // Blue
    '#dc2626', // Red
    '#16a34a', // Green
    '#9333ea', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#db2777', // Pink
    '#65a30d'  // Lime
  ];

  const handleTemplateChange = (templateId) => {
    setLocalTheme(prev => ({ ...prev, template: templateId }));
  };

  const handleColorChange = (color) => {
    setLocalTheme(prev => ({ ...prev, accentColor: color }));
  };

  const handleFontChange = (e) => {
    setLocalTheme(prev => ({ ...prev, font: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateThemeWithSync(localTheme);
      setSaveMessage('Theme saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save theme. Please try again.');
      console.error('Error saving theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="theme-customizer">
      <div className="theme-customizer-header">
        <div className="theme-header-title">
          <FaPalette className="theme-icon" />
          <h2>Customize Your Portfolio Theme</h2>
        </div>
        <p>Personalize the look and feel of your portfolio</p>
      </div>

      {saveMessage && (
        <div className={`theme-message ${saveMessage.includes('success') ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}

      {/* Template Selection */}
      <div className="theme-section">
        <div className="theme-section-header">
          <FaFileAlt />
          <h3>Template Style</h3>
        </div>
        <div className="template-grid">
          {templates.map(template => (
            <div
              key={template.id}
              className={`template-card ${localTheme.template === template.id ? 'selected' : ''}`}
              onClick={() => handleTemplateChange(template.id)}
            >
              <div className="template-radio">
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={localTheme.template === template.id}
                  onChange={() => handleTemplateChange(template.id)}
                />
              </div>
              <div className="template-info">
                <h4>{template.name}</h4>
                <p>{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accent Color Selection */}
      <div className="theme-section">
        <div className="theme-section-header">
          <FaPalette />
          <h3>Accent Color</h3>
        </div>
        <div className="color-picker-section">
          <div className="preset-colors">
            {presetColors.map(color => (
              <button
                key={color}
                className={`color-swatch ${localTheme.accentColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                title={color}
              />
            ))}
          </div>
          <div className="custom-color-picker">
            <label htmlFor="custom-color">Custom Color:</label>
            <input
              type="color"
              id="custom-color"
              value={localTheme.accentColor || '#2563eb'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-input"
            />
            <span className="color-value">{localTheme.accentColor}</span>
          </div>
        </div>
      </div>

      {/* Font Selection */}
      <div className="theme-section">
        <div className="theme-section-header">
          <FaFont />
          <h3>Font Family</h3>
        </div>
        <div className="font-selector">
          <select
            value={localTheme.font || 'Inter'}
            onChange={handleFontChange}
            className="font-dropdown"
            style={{ fontFamily: localTheme.font || 'Inter' }}
          >
            {fonts.map(font => (
              <option
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </option>
            ))}
          </select>
          <p className="font-preview" style={{ fontFamily: localTheme.font || 'Inter' }}>
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="theme-actions">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="theme-save-btn"
        >
          <FaSave />
          {isSaving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
