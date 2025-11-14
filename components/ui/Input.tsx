import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    variant?: 'default' | 'filled' | 'outlined';
    inputSize?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            variant = 'default',
            inputSize = 'md',
            className = '',
            disabled,
            required,
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

        // Classes de base améliorées pour une meilleure visibilité
        const baseClasses = `
      w-full
      rounded-lg
      border
      transition-all
      duration-200
      font-medium
      text-gray-900
      placeholder:text-gray-400
      placeholder:font-normal
      focus:outline-none
      focus:ring-4
      focus:ring-amber-500/20
      disabled:bg-gray-100
      disabled:text-gray-500
      disabled:cursor-not-allowed
      disabled:border-gray-200
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${leftIcon ? 'pl-11' : ''}
      ${rightIcon ? 'pr-11' : ''}
      ${sizeClasses[inputSize]}
      ${variantClasses[variant]}
      ${className}
    `;

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        disabled={disabled}
                        required={required}
                        className={baseClasses}
                        {...props}
                    />

                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
                    <p className="mt-2 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
