import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'solid';
    size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', children, isLoading, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-[var(--radius-box)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all duration-250 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:hover:translate-y-0 disabled:hover:shadow-none whitespace-nowrap';

        const variants = {
            primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus-visible:ring-brand-primary shadow-sm',
            solid: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus-visible:ring-brand-primary shadow-sm',
            secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus-visible:ring-gray-200 shadow-sm',
            outline: 'border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary/5 focus-visible:ring-brand-primary',
            ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-500 shadow-none hover:shadow-none',
            danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-sm',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs gap-1.5',
            md: 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm gap-2',
            lg: 'px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base gap-2',
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
