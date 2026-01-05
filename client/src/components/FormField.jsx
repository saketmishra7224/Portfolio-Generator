import React from 'react';
import { FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  touched,
  required = false,
  placeholder,
  helperText,
  maxLength,
  pattern,
  rows,
  className = '',
  icon,
  autoComplete = 'off'
}) => {
  const isValid = touched && !error && value;
  const isInvalid = touched && error;
  const remainingChars = maxLength ? maxLength - (value?.length || 0) : null;

  const inputClasses = `
    w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
    ${isInvalid ? 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:border-red-600' : ''}
    ${isValid ? 'border-green-500 bg-green-50 dark:bg-green-900/10 focus:border-green-600' : ''}
    ${!isValid && !isInvalid ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500' : ''}
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    ${isInvalid ? 'focus:ring-red-500' : isValid ? 'focus:ring-green-500' : 'focus:ring-blue-500'}
    text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    ${className}
  `.trim();

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="form-field mb-4">
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {helperText && (
          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1 inline-flex">
            <FaInfoCircle className="text-blue-500" />
            {helperText}
          </span>
        )}
      </label>

      {/* Input Field */}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <InputComponent
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          pattern={pattern}
          rows={rows}
          autoComplete={autoComplete}
          className={`${inputClasses} ${icon ? 'pl-10' : ''}`}
        />
        
        {/* Validation Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValid && <FaCheckCircle className="text-green-500 text-lg" />}
          {isInvalid && <FaExclamationCircle className="text-red-500 text-lg" />}
        </div>
      </div>

      {/* Error Message */}
      {isInvalid && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-slide-down">
          <FaExclamationCircle />
          {error}
        </p>
      )}

      {/* Character Counter */}
      {maxLength && touched && (
        <p className={`mt-1 text-xs text-right ${remainingChars < 20 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {remainingChars} characters remaining
        </p>
      )}
    </div>
  );
};

export default FormField;
