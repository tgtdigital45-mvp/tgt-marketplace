import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'solid';
    size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', children, isLoading, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95';

        const variants = {
            primary: 'bg-[#FF6B35] text-white hover:bg-[#E85D2E] focus:ring-[#FF6B35] shadow-orange-200',
            solid: 'bg-[#FF6B35] text-white hover:bg-[#E85D2E] focus:ring-[#FF6B35] shadow-orange-200', // Alias for primary/orange
            secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-200',
            outline: 'border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary/5 focus:ring-brand-primary',
            ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500 shadow-none',
            danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-red-200',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-6 py-3 text-sm',
            lg: 'px-8 py-4 text-base',
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
