module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['./__tests__/jest.setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(?:\\.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|@sentry/react-native|expo-router|@expo/.*))',
    ],
    testMatch: [
        '**/__tests__/**/*.{ts,tsx}',
        '**/*.{spec,test}.{ts,tsx}',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    collectCoverageFrom: [
        'utils/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'contexts/**/*.{ts,tsx}',
        '!**/*.d.ts',
    ],
};
