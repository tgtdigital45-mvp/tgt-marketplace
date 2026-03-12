import { renderHook, act } from '@testing-library/react-hooks';
import { useDebounce } from '../hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
    it('retorna o valor inicial imediatamente', () => {
        const { result } = renderHook(() => useDebounce('inicial', 400));
        expect(result.current).toBe('inicial');
    });

    it('não atualiza antes do delay', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 400),
            { initialProps: { value: 'inicial' } }
        );

        rerender({ value: 'novo' });
        jest.advanceTimersByTime(200);
        expect(result.current).toBe('inicial');
    });

    it('atualiza após o delay', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 400),
            { initialProps: { value: 'inicial' } }
        );

        rerender({ value: 'novo' });
        act(() => { jest.advanceTimersByTime(400); });
        expect(result.current).toBe('novo');
    });

    it('cancela atualizações intermediárias', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 400),
            { initialProps: { value: 'a' } }
        );

        rerender({ value: 'b' });
        jest.advanceTimersByTime(100);
        rerender({ value: 'c' });
        jest.advanceTimersByTime(100);
        rerender({ value: 'd' });
        act(() => { jest.advanceTimersByTime(400); });

        expect(result.current).toBe('d');
    });
});
