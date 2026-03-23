import { logger } from '../utils/logger';

jest.mock('../utils/sentry', () => ({
    captureException: jest.fn(),
    captureMessage: jest.fn(),
}));

describe('Logger Utility', () => {
    it('expõe log, warn e error', () => {
        expect(typeof logger.log).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
    });

    it('não lança exceção ao chamar os métodos', () => {
        expect(() => logger.log('teste')).not.toThrow();
        expect(() => logger.warn('aviso')).not.toThrow();
        expect(() => logger.error('erro')).not.toThrow();
    });
});
