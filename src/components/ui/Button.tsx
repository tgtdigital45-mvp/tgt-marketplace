import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', children, isLoading, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[var(--radius-box)] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
            secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500',
            outline: 'border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-primary-500',
            ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base',
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
