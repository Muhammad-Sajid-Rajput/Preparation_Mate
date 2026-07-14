import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log the error in production you would send to a logging service
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-[40px]">error</span>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-on-surface">Something went wrong</h1>
              <p className="text-on-surface-variant text-sm">
                An unexpected error occurred. This has been noted and we'll look into it.
              </p>
            </div>

            {/* Error detail (collapsed, dev-friendly) */}
            {this.state.error?.message && (
              <details className="text-left bg-surface-container rounded-lg p-4">
                <summary className="text-xs font-semibold text-outline cursor-pointer select-none">
                  Error details
                </summary>
                <p className="mt-2 text-xs text-error font-mono break-all">
                  {this.state.error.message}
                </p>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 border border-outline-variant rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
              >
                Reload page
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
