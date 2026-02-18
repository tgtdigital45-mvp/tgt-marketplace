import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '@/App';

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Check for a known element, e.g., from Header or Footer
        // Since we don't know exact content rendered initially (could be loading or landing),
        // just checking if it didn't throw is a good first step.
        // Or check for document title if Helmet is working.
        expect(document.body).toBeInTheDocument();
    });
});
