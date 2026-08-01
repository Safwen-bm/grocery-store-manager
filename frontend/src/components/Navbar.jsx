import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Navbar.css';

function Navbar({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <nav className="navbar">
        <div className="hamburger" onClick={toggleSidebar}>
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
        <Link to="/">
          <img src="/case.png" alt="Logo" className="logo" />
        </Link>
      </nav>
      <Sidebar onLogout={onLogout} isOpen={isSidebarOpen} />
    </>
  );
}

export default Navbar;