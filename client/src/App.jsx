import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import RequireAuth from './components/layout/RequireAuth';
import ExploreRedirect from './components/layout/ExploreRedirect';
import ToastContainer from './components/layout/ToastContainer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ShelfPage from './pages/ShelfPage';
import CommunityPage from './pages/CommunityPage';
import PerfumeDetailPage from './pages/PerfumeDetailPage';
import BrandsOverviewPage from './pages/BrandsOverviewPage';
import BrandPage from './pages/BrandPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import ListDetailPage from './pages/ListDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import MaintenanceGate from './components/layout/MaintenanceGate';
import { isMaintenanceMode } from './config/maintenance';

export default function App() {
  // Absichtlich vor jedem Hook: App selbst hält keinen State, deshalb kann
  // dieser Early Return die Rules of Hooks nicht verletzen.
  if (isMaintenanceMode()) {
    return (
      <MaintenanceGate>
        <AppRouter />
      </MaintenanceGate>
    );
  }

  return <AppRouter />;
}

function AppRouter() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <AppRoutes />
    </BrowserRouter>
  );
}

// Ohne eigenen Router, damit Tests einen MemoryRouter drumherum legen können.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/explore" element={<ExploreRedirect />} />
        <Route
          path="/favorites"
          element={
            <RequireAuth prompt={{ title: 'Your favorites', text: 'Sign in to see the fragrances you marked with a heart.' }}>
              <ShelfPage status="favorite" />
            </RequireAuth>
          }
        />
        <Route
          path="/collection"
          element={
            <RequireAuth prompt={{ title: 'Your collection', text: 'Sign in to keep track of the bottles you own.' }}>
              <ShelfPage status="owned" />
            </RequireAuth>
          }
        />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/perfume/:id" element={<PerfumeDetailPage />} />
        <Route path="/brands" element={<BrandsOverviewPage />} />
        <Route path="/brand/:id" element={<BrandPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/profile/:username" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="/list/:id" element={<ListDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
