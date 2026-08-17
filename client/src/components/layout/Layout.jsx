import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import TabBar from './TabBar';

export default function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <TabBar />
    </div>
  );
}
