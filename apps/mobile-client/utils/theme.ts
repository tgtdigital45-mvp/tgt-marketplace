export const Colors = {
    primary: '#0066FF',
    primaryLight: '#E6F4FE',
    primaryDark: '#0052CC',
    brand: '#0D3B2E',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfacePressed: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    success: '#10B981',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0,0,0,0.5)',
    cardShadow: '#000',
    divider: '#F3F4F6',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 24,
    xxl: 32,
    full: 9999,
};

export const Typography = {
    h1: { fontSize: 34, fontWeight: '900' as const, letterSpacing: -1 },
    h2: { fontSize: 28, fontWeight: '900' as const, letterSpacing: -0.5 },
    h3: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5 },
    h4: { fontSize: 18, fontWeight: '800' as const, letterSpacing: -0.3 },
    body: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '600' as const },
    button: { fontSize: 16, fontWeight: '800' as const },
    buttonSmall: { fontSize: 14, fontWeight: '700' as const },
    label: { fontSize: 14, fontWeight: '700' as const },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
};

export const AnimationConfig = {
    duration: {
        fast: 150,
        normal: 300,
        slow: 500,
    },
    spring: {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
    },
    pressScale: 0.97,
};
