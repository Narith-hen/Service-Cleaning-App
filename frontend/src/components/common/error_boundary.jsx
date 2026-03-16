import React from 'react';

const DefaultFallback = ({ title = 'Something went wrong.', error, onReset }) => (
  <div style={{ padding: 24, maxWidth: 640, margin: '120px auto', textAlign: 'center' }}>
    <h2 style={{ marginBottom: 8, color: '#0f172a' }}>{title}</h2>
    <p style={{ marginBottom: 16, color: '#64748b' }}>
      We couldn’t render this section. Please refresh the page or try again.
    </p>
    {error?.message && (
      <p style={{ marginBottom: 16, color: '#ef4444', fontSize: 12 }}>
        {error.message}
      </p>
    )}
    <button
      type="button"
      onClick={onReset}
      style={{
        borderRadius: 10,
        padding: '10px 18px',
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        cursor: 'pointer',
        fontWeight: 600
      }}
    >
      Reload
    </button>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallbackTitle } = this.props;

    if (hasError) {
      return <DefaultFallback title={fallbackTitle} error={error} onReset={this.handleReset} />;
    }

    return children;
  }
}

export default ErrorBoundary;
