import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '@/components/ui/Input';

describe('Input Component', () => {
    it('renders label correctly', () => {
        render(<Input id="test-input" label="Username" />);
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('handles change events', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} placeholder="Enter text" />);
        const input = screen.getByPlaceholderText('Enter text');
        fireEvent.change(input, { target: { value: 'Hello' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('displays error message', () => {
        render(<Input error="Invalid input" />);
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
        // Should have error styling
        expect(screen.getByRole('textbox').className).toContain('border-red-500');
    });

    it('displays helper text', () => {
        render(<Input helperText="Helper info" />);
        expect(screen.getByText('Helper info')).toBeInTheDocument();
    });

    it('does not display helper text when error is present', () => {
        render(<Input helperText="Helper info" error="Error" />);
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.queryByText('Helper info')).not.toBeInTheDocument();
    });
});
