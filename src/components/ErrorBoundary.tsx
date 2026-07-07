'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

/* ─── Types ─── */
export interface ErrorBoundaryProps {
  children: ReactNode;
  section?: string;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* ─── Styles ─── */
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#FBF4E6',
    border: '1px solid rgba(185, 129, 20, 0.25)',
    borderRadius: '18px',
    padding: '2.5rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    margin: '1rem 0',
  },
  icon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(238, 184, 73, 0.18)',
    border: '1px solid rgba(185, 129, 20, 0.3)',
    display: 'grid',
    placeItems: 'center',
    fontSize: '1.6rem',
    lineHeight: 1,
  },
  title: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontWeight: 800 as const,
    fontSize: '1.25rem',
    letterSpacing: '-0.025em',
    color: '#151015',
    margin: 0,
  },
  sectionLabel: {
    fontSize: '0.72rem',
    fontWeight: 700 as const,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#B98114',
    background: 'rgba(238, 184, 73, 0.14)',
    border: '1px solid rgba(185, 129, 20, 0.25)',
    padding: '0.35em 0.85em',
    borderRadius: '999px',
  },
  message: {
    color: '#6E665A',
    fontSize: '0.9rem',
    maxWidth: '40ch',
    lineHeight: 1.6,
    margin: 0,
  },
  retryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5em',
    fontWeight: 700,
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: '0.88rem',
    background: 'linear-gradient(180deg, #F2C45E, #E0A52E)',
    color: '#1B1206',
    border: 'none',
    padding: '0.7em 1.4em',
    borderRadius: '999px',
    cursor: 'pointer',
    boxShadow: '0 6px 16px -6px rgba(185, 129, 20, 0.5)',
    transition: 'transform 0.15s',
  },
};

/* ─── Component ─── */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container}>
          <div style={styles.icon}>⚠️</div>
          {this.props.section && <span style={styles.sectionLabel}>{this.props.section}</span>}
          <h3 style={styles.title}>Something went wrong</h3>
          <p style={styles.message}>
            {this.props.section
              ? `The ${this.props.section} section encountered an error and couldn't load properly.`
              : 'This section encountered an error and couldn\'t load properly.'}
          </p>
          {this.state.error && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#8C8475', margin: 0, maxWidth: '50ch', overflowWrap: 'break-word' }}>
              {this.state.error.message}
            </p>
          )}
          <button
            style={styles.retryBtn}
            onClick={this.handleRetry}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            ↻ Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
