// f:\github\test1\marketplace-app\utils\sentry.ts

const getSentry = () => {
    if (!process.env.JEST_WORKER_ID) {
        return require('@sentry/react-native');
    }
    return null;
};

export const initSentry = () => {
    const Sentry = getSentry();
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (Sentry && dsn && !dsn.includes('placeholder')) {
        Sentry.init({
            dsn: dsn,
            debug: __DEV__,
            enableAutoSessionTracking: true,
            environment: __DEV__ ? 'development' : 'production',
        });
    } else if (Sentry && __DEV__) {
        console.log('Sentry disabled: Invalid or placeholder DSN');
    }
};

export const captureException = (error: any, context?: any) => {
    const Sentry = getSentry();
    if (Sentry) {
        if (context) {
            Sentry.setContext('additional_info', context);
        }
        Sentry.captureException(error);
    }
};

export const captureMessage = (message: string) => {
    const Sentry = getSentry();
    if (Sentry) {
        Sentry.captureMessage(message);
    }
};

