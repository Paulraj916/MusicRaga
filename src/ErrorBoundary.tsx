import { Component } from 'react';
import type { ReactNode } from 'react';

/** Last-resort rendering fallback; never discards the user's local library. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal-state">
          <span className="eyebrow">POWERWORDS</span>
          <h1>A quiet pause.</h1>
          <p>
            Something interrupted this page. Your saved songs remain in this browser. Reload to try
            again; session-only imports will need to be selected again.
          </p>
          <button className="button primary" onClick={() => window.location.reload()}>
            Reload PowerWords
          </button>
        </main>
      );
    return this.props.children;
  }
}
