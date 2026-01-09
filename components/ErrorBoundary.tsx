import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    console.error('Stack trace:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-neutral-25 flex flex-col items-center justify-center p-6 gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-8 max-w-md shadow-cards">
            <h2 className="text-h4 font-bold text-neutral-900 mb-4">Ops! Algo deu errado</h2>
            <p className="text-body2 text-neutral-600 mb-4">
              Ocorreu um erro ao carregar a aplicação. Por favor, recarregue a página.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-small font-bold text-neutral-500 cursor-pointer mb-2">
                  Detalhes do erro
                </summary>
                <pre className="text-[10px] bg-neutral-50 p-3 rounded border border-neutral-200 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary-500 text-white rounded-lg py-3 font-bold hover:bg-primary-600 transition-colors"
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

