import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Expose Zustand stores for E2E test state seeding (dev only)
if (import.meta.env.DEV) {
  import('./lib/stores').then((stores) => {
    (window as any).__taskStore = stores.useTaskStore;
    (window as any).__completionStore = stores.useCompletionStore;
    (window as any).__rewardStore = stores.useRewardStore;
    (window as any).__authStore = stores.useAuthStore;
  });
}
