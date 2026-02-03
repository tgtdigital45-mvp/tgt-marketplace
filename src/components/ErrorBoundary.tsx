import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isChunkError = this.state.error?.message.includes('Failed to fetch dynamically imported module') ||
                this.state.error?.message.includes('Importing a module script failed');

            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md w-full shadow-sm">
                        <h2 className="text-xl font-semibold text-red-700 mb-2">Ops! Algo deu errado.</h2>
                        <p className="text-gray-600 mb-6">
                            {isChunkError
                                ? "Foi detectada uma nova versão da aplicação. Por favor, recarregue a página."
                                : "Encontramos um erro inesperado ao carregar esta página."}
                        </p>

                        {/* Dev details - hidden in prod normally, but helpful here */}
                        {process.env.NODE_ENV === 'development' && !isChunkError && (
                            <pre className="text-xs text-left bg-gray-100 p-2 rounded mb-4 overflow-auto max-h-32 text-red-900 border border-red-100">
                                {this.state.error?.toString()}
                            </pre>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium shadow-sm active:transform active:scale-95"
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
