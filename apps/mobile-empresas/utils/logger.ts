import { captureException } from './sentry';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const logger = {
    log: (...args: unknown[]) => { if (isDev) console.log(...args); },
    warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
    error: (...args: unknown[]) => {
        if (isDev) {
            console.error(...args);
        } else {
            // Se o primeiro argumento for um erro, envia pro Sentry
            if (args[0] instanceof Error) {
                captureException(args[0], { extra: args.slice(1) });
            } else {
                captureException(new Error(String(args[0])), { extra: args.slice(1) });
            }
        }
    },
};
