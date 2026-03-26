import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/stores/authStore';
import { useSubscriptions } from './lib/hooks/useSubscriptions';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ParentPin from './pages/ParentPin';
import Child from './pages/Child';
import Parent from './pages/Parent';
import Manage from './pages/Manage';
import NewTask from './pages/tasks/New';
import EditTask from './pages/tasks/Edit';
import NewReward from './pages/rewards/New';
import EditReward from './pages/rewards/Edit';
import Canguru from './pages/Canguru';

function DataSubscriptions() {
  useSubscriptions();
  return null;
}

function AppRoutes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const role = useAuthStore((s) => s.role);
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-galo-black flex items-center justify-center">
        <span className="text-5xl animate-pulse">⭐</span>
      </div>
    );
  }

  if (needsOnboarding) return <Onboarding />;

  return (
    <>
      {isAuthenticated && <DataSubscriptions />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/parent-pin"
          element={isAuthenticated ? <ParentPin /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/child"
          element={isAuthenticated ? <Child /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/child/canguru"
          element={isAuthenticated ? <Canguru /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/parent"
          element={
            isAuthenticated && role === 'parent' ? <Parent /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/parent/manage"
          element={
            isAuthenticated && role === 'parent' ? <Manage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/parent/tasks/new"
          element={
            isAuthenticated && role === 'parent' ? <NewTask /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/parent/tasks/:id"
          element={
            isAuthenticated && role === 'parent' ? <EditTask /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/parent/rewards/new"
          element={
            isAuthenticated && role === 'parent' ? <NewReward /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/parent/rewards/:id"
          element={
            isAuthenticated && role === 'parent' ? <EditReward /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated
              ? role === 'parent'
                ? <Navigate to="/parent" replace />
                : <Navigate to="/child" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
