import React from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔥</div>
          <h2>Oops, something went wrong!</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '500px' }}>
            We're sorry, an unexpected error occurred. Our team has been notified.
            If the problem persists, please try refreshing the page.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
            <Link to="/" className="btn btn-primary" onClick={() => this.setState({ hasError: false })}>
              Go Home
            </Link>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ marginTop: '2rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius)', textAlign: 'left', overflowX: 'auto', maxWidth: '100%' }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
