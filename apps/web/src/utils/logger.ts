/**
 * Conditional logger — only outputs in development mode.
 * Use instead of raw console.log to prevent data leaks in production.
 */
const isDev = import.meta.env.DEV;

export const devLog = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export const devWarn = (...args: unknown[]): void => {
  if (isDev) console.warn(...args);
};

// console.error always runs — errors must be visible in production too
export const logError = (message: string, ...args: unknown[]): void => {
  console.error(message, ...args);
};
