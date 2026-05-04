import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import PerfumeDetailPage from './pages/PerfumeDetailPage';
import BrandsOverviewPage from './pages/BrandsOverviewPage';
import BrandPage from './pages/BrandPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import ListDetailPage from './pages/ListDetailPage';
import NotFoundPage from './pages/NotFoundPage';

import RequireAuth from './components/auth/RequireAuth';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    let cleanup;
    initialize().then(fn => { cleanup = fn; });
    return () => {
      if (cleanup) cleanup();
    };
  }, [initialize]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/perfume/:id" element={<PerfumeDetailPage />} />
            <Route path="/brands" element={<BrandsOverviewPage />} />
            <Route path="/brand/:id" element={<BrandPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* The routes below are public for viewing, but could be moved inside a <RequireAuth> block if they should be strictly private later */}
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/list/:id" element={<ListDetailPage />} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
