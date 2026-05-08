import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import RequireAuth from './components/layout/RequireAuth';
import ToastContainer from './components/layout/ToastContainer';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import PerfumeDetailPage from './pages/PerfumeDetailPage';
import BrandsOverviewPage from './pages/BrandsOverviewPage';
import BrandPage from './pages/BrandPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ListDetailPage from './pages/ListDetailPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/perfume/:id" element={<PerfumeDetailPage />} />
          <Route path="/brands" element={<BrandsOverviewPage />} />
          <Route path="/brand/:id" element={<BrandPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/:username" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/profile/edit" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
          <Route path="/list/:id" element={<ListDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
