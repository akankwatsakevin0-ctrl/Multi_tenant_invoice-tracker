// =============================================================================
// App — Root Router Component
// =============================================================================

import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { CookieConsent } from './components/GDPR/CookieConsent';
import { useAuthStore } from './store/authStore';

// Lazy-loaded pages
const Login = React.lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Invoices = React.lazy(() => import('./pages/Invoices').then((m) => ({ default: m.Invoices })));
const InvoiceCreate = React.lazy(() => import('./pages/InvoiceCreate').then((m) => ({ default: m.InvoiceCreate })));
const InvoiceEdit = React.lazy(() => import('./pages/InvoiceEdit').then((m) => ({ default: m.InvoiceEdit })));
const InvoiceDetail = React.lazy(() => import('./pages/InvoiceDetail').then((m) => ({ default: m.InvoiceDetail })));
const Clients = React.lazy(() => import('./pages/Clients').then((m) => ({ default: m.Clients })));
const Profile = React.lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Privacy = React.lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const Terms = React.lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const NotFound = React.lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Protected route wrapper
// ---------------------------------------------------------------------------

const ProtectedRoute: React.FC = () => {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <React.Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </React.Suspense>
    </AppLayout>
  );
};

// ---------------------------------------------------------------------------
// Public route wrapper — redirects to dashboard if already logged in
// ---------------------------------------------------------------------------

const PublicRoute: React.FC = () => {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </React.Suspense>
  );
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export const App: React.FC = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceCreate />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Catch-all */}
        <Route
          path="/"
          element={
            <Navigate
              to={useAuthStore.getState().user ? '/dashboard' : '/login'}
              replace
            />
          }
        />
        <Route
          path="*"
          element={
            <React.Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </React.Suspense>
          }
        />
      </Routes>

      {/* Global GDPR Cookie Consent Banner */}
      <CookieConsent />
    </BrowserRouter>
  );
};
