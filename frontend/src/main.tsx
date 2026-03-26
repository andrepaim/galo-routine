import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

class ErrorBoundary extends Component<{children: ReactNode}, {error: string | null}> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding: 24, color: '#f87171', background: '#111', minHeight: '100vh', fontFamily: 'monospace'}}>
          <div style={{fontSize: 24, marginBottom: 16}}>⚠️ App Error</div>
          <div style={{fontSize: 12, color: '#9ca3af', marginBottom: 16}}>{this.state.error}</div>
          <button onClick={() => { localStorage.clear(); location.reload(); }}
            style={{background: '#FFCC00', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold'}}>
            Clear cache &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
