import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and state for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="h-full flex items-center justify-center bg-red-50">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600 mb-4">
              An error occurred while rendering this component. Please try refreshing the page.
            </p>
            
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                // Optionally refresh the page
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
            
            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-red-700 cursor-pointer">
                  View error details (development)
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">
                  <p><strong>Error:</strong> {this.state.error.toString()}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
