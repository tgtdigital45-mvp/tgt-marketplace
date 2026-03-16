import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isChunkError = this.state.error?.message.includes('Failed to fetch dynamically imported module') ||
                this.state.error?.message.includes('Importing a module script failed');

            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.5rem', padding: '2rem', maxWidth: '28rem', width: '100%', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#B91C1C', marginBottom: '0.5rem' }}>Ops! Algo deu errado.</h2>
                        <p style={{ color: '#4B5563', marginBottom: '1.5rem' }}>
                            {isChunkError
                                ? "Foi detectada uma nova versão da aplicação. Por favor, recarregue a página."
                                : "Encontramos um erro inesperado ao carregar esta página."}
                        </p>

                        <button
                            onClick={this.handleReload}
                            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#DC2626', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
