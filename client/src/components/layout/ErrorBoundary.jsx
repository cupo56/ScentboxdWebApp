import { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * Catches JS errors in child components and shows a fallback UI
 * instead of crashing the entire application.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page container">
          <div className="empty-state" style={{ paddingTop: '80px' }}>
            <div className="icon" style={{ fontSize: '4rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Something went wrong</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Refresh Page
              </button>
              <Link to="/" className="btn btn-secondary" onClick={() => this.setState({ hasError: false, error: null })}>
                Back Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
