import React, { ButtonHTMLAttributes } from 'react';

interface SocialButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    provider: 'google' | 'apple' | 'facebook';
    mode?: 'full' | 'icon';
    children?: React.ReactNode;
}

const SocialButton = React.forwardRef<HTMLButtonElement, SocialButtonProps>(
    ({ className = '', provider, mode = 'full', children, ...props }, ref) => {
        const getIcon = () => {
            const iconSize = mode === 'icon' ? 'w-6 h-6' : 'w-5 h-5 mr-3';

            switch (provider) {
                case 'google':
                    return (
                        <svg className={iconSize} viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        </svg>
                    );
                case 'apple':
                    return (
                        <svg className={`${iconSize} text-black`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-1 2.8-1.54 1.94-.38 2.01-.2 2.76 1.05-2.82 2.99-1.89 7.42 1.37 8.35-.91 2.27-2.9 5.35-2.01 4.37zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                    );
                case 'facebook':
                    return (
                        <svg className={`${iconSize} text-[#1877F2]`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.603-2.797 2.898v1.074h5.47l-.207 3.667h-5.263v7.98h-4.538z" />
                        </svg>
                    );
                default:
                    return null;
            }
        };

        const defaultText = `Entrar com ${provider.charAt(0).toUpperCase() + provider.slice(1)}`;

        const baseClasses = `
            inline-flex items-center justify-center 
            border border-gray-200 shadow-sm
            font-bold text-gray-700 bg-white 
            hover:bg-gray-50 hover:shadow-md 
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary/50 
            transition-all duration-200 rounded-xl
        `;

        const modeClasses = mode === 'full'
            ? 'w-full px-4 py-3 text-sm'
            : 'w-16 h-12 px-0 text-base'; // Fixed width for icon buttons, adjusted to be rectangular-ish or square as needed

        return (
            <button
                ref={ref}
                type="button"
                className={`${baseClasses} ${modeClasses} ${className}`}
                {...props}
            >
                {getIcon()}
                {mode === 'full' && (children || defaultText)}
            </button>
        );
    }
);

SocialButton.displayName = 'SocialButton';

export default SocialButton;
