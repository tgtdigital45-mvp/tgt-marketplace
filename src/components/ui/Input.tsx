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
              appearance-none block w-full px-3 py-2 border border-gray-300 
              rounded-[var(--radius-box)] shadow-sm placeholder-gray-400 
              focus:outline-none focus:ring-primary-500 focus:border-primary-500 
              sm:text-sm
              disabled:bg-gray-100 disabled:text-gray-500
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
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
