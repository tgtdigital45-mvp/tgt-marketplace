export const DESIGN_TOKENS = {
    colors: {
        brand: {
            primary: '#FF6B35',    // Laranja Sinal (Energia, Local, Acessível)
            secondary: '#004E89',  // Azul Profundo (Confiança, Profissionalismo)
            accent: '#F7B801',     // Amarelo Dourado (Destaque, Otimismo)
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
            sans: ['Inter', 'system-ui', 'sans-serif'],
            display: ['Clash Display', 'Inter', 'sans-serif'] // Recomendação futura
        },
        sizes: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
            '6xl': '3.75rem',
            '7xl': '4.5rem',
            '8xl': '6rem',
            '9xl': '8rem',
            massive: '12rem',  // 192px
            '10xl': '10rem',   // 160px
            '11xl': '11rem',   // 176px
        }
    },
    borderRadius: {
        none: '0px',
        sharp: '2px',     // Estilo Técnico/Brutalista
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
    },
    spacing: {
        container: {
            padding: '1rem',
            maxWidth: '1280px',
        }
    },
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    }
} as const;

// Helper type para Core Colors
export type BrandColor = keyof typeof DESIGN_TOKENS.colors.brand;
