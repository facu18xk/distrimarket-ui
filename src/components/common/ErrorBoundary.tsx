import React from 'react';
import { ErrorPage } from './ErrorPage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onHome?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Si una pantalla falla al dibujarse (dato inesperado, error de programación), se muestra la
 * página de error 500 en lugar de dejar la aplicación en blanco.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error al mostrar la pantalla', error, info.componentStack);
  }

  private reintentar = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <ErrorPage
          code={500}
          detail="La pantalla no pudo mostrarse."
          onRetry={this.reintentar}
          onHome={
            this.props.onHome &&
            (() => {
              this.reintentar();
              this.props.onHome?.();
            })
          }
        />
      );
    }
    return this.props.children;
  }
}
