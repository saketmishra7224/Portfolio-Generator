import React, { useState } from 'react';
import { FaCheckCircle, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';

const TemplateSelector = ({ selectedTemplate, onSelectTemplate }) => {
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  const templates = [
    {
      id: 'modern',
      name: 'Modern',
      description: 'Clean and contemporary design with bold typography',
      color: 'from-blue-500 to-purple-600',
      preview: (
        <div className="template-preview-mini bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 w-full"></div>
          <div className="p-4 space-y-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="h-12 bg-blue-200 dark:bg-blue-800 rounded"></div>
              <div className="h-12 bg-purple-200 dark:bg-purple-800 rounded"></div>
              <div className="h-12 bg-pink-200 dark:bg-pink-800 rounded"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Traditional and formal layout ideal for corporate profiles',
      color: 'from-gray-700 to-gray-900',
      preview: (
        <div className="template-preview-mini bg-white dark:bg-gray-800">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex-1 space-y-1">
                <div className="h-2 w-20 bg-gray-400 dark:bg-gray-500 rounded"></div>
                <div className="h-2 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
            <div className="h-px bg-gray-300 dark:bg-gray-600 my-3"></div>
            <div className="space-y-1">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-2 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simplistic and elegant design focusing on content',
      color: 'from-gray-400 to-gray-600',
      preview: (
        <div className="template-preview-mini bg-gray-50 dark:bg-gray-900">
          <div className="p-4 space-y-3">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 rounded-full bg-gray-800 dark:bg-gray-200 mx-auto"></div>
              <div className="h-2 w-20 bg-gray-800 dark:bg-gray-200 rounded mx-auto"></div>
            </div>
            <div className="h-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="space-y-2">
              <div className="h-2 w-16 bg-gray-400 dark:bg-gray-600 rounded"></div>
              <div className="flex gap-2">
                <div className="h-6 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'classic',
      name: 'Classic',
      description: 'Timeless design with balanced sections',
      color: 'from-amber-600 to-orange-700',
      preview: (
        <div className="template-preview-mini bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-3">
            <div className="h-8 w-8 rounded-full bg-white/90 mb-2"></div>
            <div className="h-2 w-20 bg-white/90 rounded"></div>
          </div>
          <div className="p-3 space-y-2">
            <div className="h-2 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-2 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="h-10 bg-amber-100 dark:bg-amber-900/30 rounded"></div>
              <div className="h-10 bg-orange-100 dark:bg-orange-900/30 rounded"></div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="template-selector-container">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Template
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Select a template that best represents your professional style
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.03 }}
            onHoverStart={() => setHoveredTemplate(template.id)}
            onHoverEnd={() => setHoveredTemplate(null)}
            onClick={() => onSelectTemplate(template.id)}
            className={`template-card cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
              selectedTemplate === template.id
                ? 'ring-4 ring-blue-500 shadow-2xl'
                : 'ring-1 ring-gray-200 dark:ring-gray-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {/* Template Preview */}
            <div className="relative h-48 bg-white dark:bg-gray-800 overflow-hidden">
              {template.preview}
              
              {/* Hover Overlay */}
              {hoveredTemplate === template.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center"
                >
                  <div className="text-white text-center">
                    <FaEye className="text-3xl mx-auto mb-2" />
                    <p className="text-sm font-medium">Preview Template</p>
                  </div>
                </motion.div>
              )}

              {/* Selected Badge */}
              {selectedTemplate === template.id && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-2">
                  <FaCheckCircle className="text-xl" />
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className={`p-4 bg-gradient-to-r ${template.color} text-white`}>
              <h4 className="font-bold text-lg mb-1">{template.name}</h4>
              <p className="text-sm opacity-90">{template.description}</p>
            </div>

            {/* Selection Button */}
            <div className="p-3 bg-white dark:bg-gray-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTemplate(template.id);
                }}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  selectedTemplate === template.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {selectedTemplate === template.id ? 'Selected' : 'Select Template'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Current Selection Info */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg"
        >
          <p className="text-blue-900 dark:text-blue-300 font-medium">
            ✓ Currently using: <span className="font-bold">
              {templates.find(t => t.id === selectedTemplate)?.name}
            </span> template
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default TemplateSelector;
