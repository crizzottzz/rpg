import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-bold text-heading mb-2">Something went wrong</h2>
            <p className="text-label mb-4">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 bg-accent-bold hover:bg-accent text-accent-fg font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
