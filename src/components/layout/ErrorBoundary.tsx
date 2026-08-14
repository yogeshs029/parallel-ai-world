import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Parallel Uncaught Runtime Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-grid-pattern">
          <div className="max-w-xl w-full bg-background-surface border border-accent-rose/30 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 text-accent-rose">
              <div className="p-3 bg-accent-rose/10 rounded-xl border border-accent-rose/20">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  System Kernel Interrupt
                </h1>
                <p className="text-xs text-text-secondary">
                  Parallel AI Command Center encountered an unhandled exception.
                </p>
              </div>
            </div>

            <div className="bg-background-deep border border-border rounded-lg p-4 font-mono text-xs text-text-secondary overflow-x-auto max-h-48 space-y-2">
              <div className="text-accent-rose font-medium">
                {this.state.error?.name}: {this.state.error?.message}
              </div>
              {this.state.error?.stack && (
                <pre className="text-[11px] text-text-muted leading-relaxed whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleCopyError}
                leftIcon={this.state.copied ? Check : Copy}
              >
                {this.state.copied ? 'Copied Diagnostics' : 'Copy Diagnostics'}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.location.reload()}
                  leftIcon={RefreshCw}
                >
                  Reload App
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={this.handleReset}
                  leftIcon={Home}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
