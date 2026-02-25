export const DESIGN_TOKENS = {
    colors: {
        brand: {
            primary: '#FF6B35',
            primaryHover: '#E85D2E',
            secondary: '#004E89',
            secondaryHover: '#003B66',
            accent: '#F7B801',
            success: '#10b981',
            dark: '#0f172a',
        },
        primary: {
            '50': '#fff4ed',
            '100': '#ffe6d5',
            '200': '#feccaa',
            '300': '#fdac74',
            '400': '#fb803c',
            '500': '#f96316',
            '600': '#FF6B35',
            '700': '#c23809',
            '800': '#9b2f0e',
            '900': '#7c290f',
            '950': '#431205',
        },
        neutral: {
            white: '#FFFFFF',
            black: '#1A1A1A',
            gray: {
                50: '#F9FAFB',
                100: '#F3F4F6',
                200: '#E5E7EB',
                300: '#D1D5DB',
                400: '#9CA3AF',
                500: '#6B7280',
                600: '#4B5563',
                700: '#374151',
                800: '#1F2937',
                900: '#111827',
                950: '#030712',
            }
        }
    },
    typography: {
        fontFamily: {
            sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
            display: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
        },
    },
    borderRadius: {
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        pill: '9999px',
    },
    spacing: {
        section: { sm: '3rem', DEFAULT: '4rem', lg: '6rem' },
        container: { padding: '1rem', maxWidth: '1280px' },
    },
} as const;

export type BrandColor = keyof typeof DESIGN_TOKENS.colors.brand;
