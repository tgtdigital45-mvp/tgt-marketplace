// f:\github\test1\marketplace-app\__tests__\jest.setup.js
jest.mock('@sentry/react-native', () => ({
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setContext: jest.fn(),
    withScope: jest.fn(),
    nativeStatus: jest.fn(),
    SDK_NAME: 'sentry.javascript.react-native',
    SDK_VERSION: '0.0.0',
    ReactNativeTracing: jest.fn().mockImplementation(() => ({})),
    ReactNavigationInstrumentation: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useSegments: () => ['(tabs)', 'index'],
}));
