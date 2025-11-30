import React, { forwardRef, TextareaHTMLAttributes, memo } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  textareaSize?: 'sm' | 'md' | 'lg';
}

const Textarea = memo(forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      textareaSize = 'md',
      className = '',
      disabled,
      required,
      rows = 4,
      ...props
    },
    ref
  ) => {
    // Tailles
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    // Variantes
    const variantClasses = {
      default: 'bg-white border-gray-300 focus:border-amber-500',
      filled: 'bg-gray-50 border-gray-200 focus:bg-white focus:border-amber-500',
      outlined: 'bg-transparent border-2 border-gray-300 focus:border-amber-500',
    };

    // Classes de base améliorées
    const baseClasses = `
      w-full
      rounded-lg
      border
      transition-all
      duration-200
      font-medium
      text-luxury-dark
      placeholder:text-gray-400
      placeholder:font-normal
      focus:outline-none
      focus:ring-4
      focus:ring-amber-500/20
      disabled:bg-gray-100
      disabled:text-gray-500
      disabled:cursor-not-allowed
      disabled:border-gray-200
      resize-y
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${sizeClasses[textareaSize]}
      ${variantClasses[variant]}
      ${className}
    `;

    const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="requis">*</span>}
          </label>
        )}
  
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          rows={rows}
          className={baseClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          {...props}
        />
  
        {error && (
          <p id={errorId} className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
  
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
));

Textarea.displayName = 'Textarea';

export default Textarea;
