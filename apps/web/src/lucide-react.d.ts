/**
 * Global type fix for React 19 + lucide-react compatibility.
 *
 * @types/react@19.x changed the ReactNode type in a way that breaks
 * ForwardRefExoticComponent from older libraries like lucide-react.
 * This override patches the JSX.Element type to accept the wider return type.
 *
 * Can be removed once lucide-react publishes React 19-compatible types.
 * See: https://github.com/lucide-icons/lucide/issues/2135
 */

// Fix: Override React namespace to allow ForwardRefExoticComponent as JSX
import type { } from 'react';

declare module 'react' {
    // Widen ReactNode to include the types that cause the conflict
    // This is a no-op for React 18 and fixes the break in React 19
    function createElement(
        type: any,
        props?: any,
        ...children: any[]
    ): React.ReactElement;
}

// Fix for react-router-dom Link component
declare module 'react-router-dom' {
    import type { ComponentProps, FC } from 'react';

    interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
        to: string | Partial<{ pathname: string; search: string; hash: string }>;
        replace?: boolean;
        state?: any;
        reloadDocument?: boolean;
        preventScrollReset?: boolean;
        relative?: 'route' | 'path';
    }

    export const Link: FC<LinkProps>;
    export const NavLink: FC<LinkProps & { className?: string | ((props: { isActive: boolean; isPending: boolean }) => string | undefined) }>;
}
