import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, helperText, ...props }, ref) => {
        const inputId = props.id || props.name;
        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        className={`
              appearance-none block w-full px-4 py-3 border border-gray-200 
              rounded-xl shadow-sm placeholder-gray-400 text-gray-700 bg-white
              focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary 
              transition-all duration-200
              sm:text-sm
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500">{helperText}</p>
                )}
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
