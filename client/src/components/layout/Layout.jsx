import { Outlet } from 'react-router-dom';
import Aurora from './Aurora';
import InstagramBanner from './InstagramBanner';
import Navbar from './Navbar';
import Footer from './Footer';
import TabBar from './TabBar';

export default function Layout() {
  return (
    <div className="layout">
      <Aurora />
      <InstagramBanner />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <TabBar />
    </div>
  );
}
