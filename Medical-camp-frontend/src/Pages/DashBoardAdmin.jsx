import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/Dashboard.css';

/* SVG icons for a clean, professional look */
const icons = {
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-8" />
    </svg>
  ),
  realtime: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  profiles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  pill: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5l-8 8a5 5 0 0 0 7.07 7.07l8-8a5 5 0 0 0-7.07-7.07z" /><path d="M13.5 6.5l4 4" />
    </svg>
  ),
  pillPlus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5l-8 8a5 5 0 0 0 7.07 7.07l8-8a5 5 0 0 0-7.07-7.07z" /><line x1="12" y1="8" x2="12" y2="14" /><line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  ),
  stethoscope: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" />
    </svg>
  ),
  userPlus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  flask: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" /><path d="M10 3v7.4a2 2 0 0 1-.5 1.3L4 18.6a1 1 0 0 0 .7 1.7h14.6a1 1 0 0 0 .7-1.7l-5.5-6.9A2 2 0 0 1 14 10.4V3" />
    </svg>
  ),
  qrcode: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" rx="1" /><rect x="20" y="14" width="2" height="2" /><rect x="14" y="20" width="2" height="2" /><rect x="20" y="20" width="2" height="2" />
    </svg>
  ),
  log: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  inventory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

/* Section groups for the admin dashboard */
const sections = [
  {
    title: 'Analytics & Monitoring',
    description: 'Track camp performance and real-time data',
    color: '#2563eb',
    cards: [
      { title: 'Camp Analytics', icon: icons.analytics, path: '/camp-analytics' },
      { title: 'Real-time Analytics', icon: icons.realtime, path: '/real-time-analytics' },
      { title: 'View Logs', icon: icons.log, path: '/log' },
    ],
  },
  {
    title: 'People Management',
    description: 'Manage doctors, volunteers, and patient profiles',
    color: '#059669',
    cards: [
      { title: 'Profiles', icon: icons.profiles, path: '/profiles' },
      { title: 'Add Doctor', icon: icons.stethoscope, path: '/add-doctor' },
      { title: 'Add Volunteer', icon: icons.userPlus, path: '/add-volunteer' },
      { title: 'Doctor Availability', icon: icons.calendar, path: '/doctor-availability' },
    ],
  },
  {
    title: 'Pharmacy & Inventory',
    description: 'Manage medicine stock and distribution',
    color: '#d97706',
    cards: [
      { title: 'View Medicines', icon: icons.list, path: '/get-medicines' },
      { title: 'Update Stock', icon: icons.inventory, path: '/update-medicine-stock' },
      { title: 'Add New Medicine', icon: icons.pillPlus, path: '/add-new-medicine' },
    ],
  },
  {
    title: 'Operations',
    description: 'Lab tests, QR codes, and camp tools',
    color: '#7c3aed',
    cards: [
      { title: 'Manage Lab Tests', icon: icons.flask, path: '/manage-labtests' },
      { title: 'Download QR Codes', icon: icons.qrcode, path: '/downloadQrcode' },
    ],
  },
];

/* Brand icon for sidebar */
const BrandIcon = () => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="2" width="6" height="22" rx="2" fill="white" />
    <rect x="2" y="10" width="22" height="6" rx="2" fill="white" />
  </svg>
);

function DashboardAdmin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          <div className="dashboard-sidebar-brand-icon">
            <BrandIcon />
          </div>
          <div className="dashboard-sidebar-brand-name">
            IFHE
            <span>Healthcare Admin</span>
          </div>
        </div>
        <button className="dashboard-sidebar-logout" onClick={handleLogout}>
          Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-greeting">
            <h1>Admin Dashboard</h1>
            <p>Medical Camp Operations Center</p>
          </div>
        </header>

        {/* Grouped sections */}
        {sections.map((section, sIdx) => (
          <div className="dashboard-section" key={sIdx}>
            <div className="dashboard-section-header">
              <div className="dashboard-section-accent" style={{ background: section.color }} />
              <div>
                <h2 className="dashboard-section-title">{section.title}</h2>
                <p className="dashboard-section-desc">{section.description}</p>
              </div>
            </div>
            <div className="dashboard-card-container">
              {section.cards.map((card, cIdx) => (
                <Link to={card.path} key={cIdx} className="dashboard-card-link">
                  <div className="dashboard-card" style={{ '--card-accent': section.color }}>
                    <div className="dashboard-card-icon-svg" style={{ color: section.color, background: `${section.color}12` }}>
                      {card.icon}
                    </div>
                    <div className="dashboard-card-content">
                      <h3>{card.title}</h3>
                    </div>
                    <div className="dashboard-card-arrow" style={{ color: section.color }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default DashboardAdmin;
