import { useRef, useCallback } from 'react';

/**
 * A hook that provides a mechanism to lock an asynchronous function from being called again
 * while it is currently executing.
 * @returns [withLock, isLocked]
 */
export function useLock(): [<TArgs extends any[], TRet>(fn: (...args: TArgs) => Promise<TRet>) => (...args: TArgs) => Promise<TRet | undefined>, boolean] {
    const isLocked = useRef(false);

    const withLock = useCallback(
        <TArgs extends any[], TRet>(fn: (...args: TArgs) => Promise<TRet>) => {
            return async (...args: TArgs): Promise<TRet | undefined> => {
                if (isLocked.current) {
                    return undefined; // Drop the call
                }

                isLocked.current = true;
                try {
                    return await fn(...args);
                } finally {
                    isLocked.current = false;
                }
            };
        },
        []
    );

    return [withLock, isLocked.current];
}
