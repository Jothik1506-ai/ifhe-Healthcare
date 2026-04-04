import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import "../Styles/Navbar.css";
import SwechaLogo from "./SwechaLogo.png";
import { privateAxios } from '../api/axios';

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const type = localStorage.getItem('userType');
    setIsLoggedIn(!!token);
    setUserType(type);
    setMenuOpen(false); // close menu on navigation
  }, [pathname]);

  const handleLogout = async () => {
    await privateAxios.post('/api/logs', { action: 'Logout' });
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    navigate('/');
  };

  const ADMIN_DASH = '/dashboard-admin';
  const VOLUNTEER_DASH = '/dashboard';

  const showMenuIcon =
    isLoggedIn &&
    (userType === 'admin' || userType === 'volunteer') &&
    pathname !== ADMIN_DASH &&
    pathname !== VOLUNTEER_DASH;

  const adminNavLinks = [
    { path: ADMIN_DASH, label: 'Dashboard' },
    { path: '/camp-analytics', label: 'Camp Analytics' },
    { path: '/doctor-availability', label: 'Doctor Availability' },
    { path: '/update-medicine-stock', label: 'Update Medicine Stock' },
    { path: '/get-doctors', label: 'View Doctors', menuOnly: true },
    { path: '/get-medicines', label: 'View Medicines', menuOnly: true },
    { path: '/get-volunteers', label: 'View Volunteers', menuOnly: true },
    { path: '/view-patients', label: 'View Patients', menuOnly: true },
    { path: '/add-new-medicine', label: 'Add New Medicine', menuOnly: true },
    { path: '/add-doctor', label: 'Add Doctor', menuOnly: true },
    { path: '/add-volunteer', label: 'Add Volunteer', menuOnly: true },
    { path: '/log', label: 'View Logs', menuOnly: true },
  ];

  const volunteerNavLinks = [
    { path: VOLUNTEER_DASH, label: 'Dashboard' },
    { path: '/patient-registration', label: 'Patient Registration' },
    { path: '/view-queue', label: 'View Queues' },
    { path: '/vitals', label: 'Vitals', menuOnly: true },
    { path: '/doctor-assigning', label: 'Doctor Assigning', menuOnly: true },
    { path: '/doctor-assigning-automatic', label: 'Doctor Assigning Automatic', menuOnly: true },
    { path: '/doctor-prescription', label: 'Doctor Prescription', menuOnly: true },
    { path: '/medicine-pickup', label: 'Stock Update', menuOnly: true },
  ];

  let linksToDisplay = [];
  if (isLoggedIn && userType === 'admin') {
    linksToDisplay = pathname === ADMIN_DASH ? [] : adminNavLinks;
  } else if (isLoggedIn && userType === 'volunteer') {
    linksToDisplay = pathname === VOLUNTEER_DASH ? [] : volunteerNavLinks;
  }

  const mainLinks = linksToDisplay.filter(l => !l.menuOnly);
  const menuLinks = linksToDisplay.filter(l => l.menuOnly);

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">
          <img src={SwechaLogo} alt="Swecha Logo" className="logo-img" />
        </Link>
      </div>

      {/* wrap all link elements so we can push them right of logo but left of logout */}
      <div className="nav-group">
        {/* desktop inline links */}
        <ul className="desktop-links">
          {mainLinks.map((link, idx) => (
            <li key={idx}>
              <Link to={link.path}>{link.label}</Link>
            </li>
          ))}
        </ul>

        {/* original mobile dropdown */}
        <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
          {linksToDisplay.map((link, idx) => (
            <li key={idx}>
              <Link to={link.path} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {showMenuIcon && (
          <>
            <button
              className="menu-icon"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              ☰
            </button>

            {/* desktop‑only dropdown (no bullets) */}
            <ul className={`desktop-menu${menuOpen ? ' open' : ''}`}>
              {menuLinks.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.path} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {isLoggedIn && (
        <div className="logout-container">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
