import { describe, it, expect } from 'vitest';
import { calculateDistance } from '@/utils/geo';

describe('calculateDistance', () => {
    it('should calculate the distance between two points correctly (São Paulo -> Rio de Janeiro)', () => {
        // SP: -23.5505, -46.6333
        // RJ: -22.9068, -43.1729
        // Approx distance: ~350-360km straight line
        const distance = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
        expect(distance).toBeGreaterThan(350);
        expect(distance).toBeLessThan(370);
    });

    it('should return 0 for the same point', () => {
        const distance = calculateDistance(0, 0, 0, 0);
        expect(distance).toBe(0);
    });

    it('should handle small distances correctly (1km)', () => {
        // Two points roughly 1km apart
        // Lat 1 deg ~= 111km. 0.009 deg ~= 1km
        const distance = calculateDistance(10, 10, 10.009, 10);
        expect(distance).toBeCloseTo(1.0, 1);
    });
});
