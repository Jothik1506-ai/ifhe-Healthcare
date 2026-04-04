import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQrScanner } from '../Context/QrScannerContext';
import '../Styles/Dashboard.css';

/* ── Brand Icon SVG ─────────────────────────────────────── */
const BrandIcon = () => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="2" width="6" height="22" rx="2" fill="white" />
    <rect x="2" y="10" width="22" height="6" rx="2" fill="white" />
  </svg>
);

/* ── SVG Icons ─────────────────────────────────────── */
const svgIcons = {
  register: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  assign: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" />
    </svg>
  ),
  vitals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  consultation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  prescription: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  medicine: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5l-8 8a5 5 0 0 0 7.07 7.07l8-8a5 5 0 0 0-7.07-7.07z" /><path d="M13.5 6.5l4 4" />
    </svg>
  ),
  counselling: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  food: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  status: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
};

/* ── Workflow sections for volunteer dashboard ─────────── */
const sections = [
  {
    title: 'Patient Intake',
    description: 'Registration and initial assessment',
    color: '#2563eb',
    cards: [
      { title: 'Patient Registration', icon: svgIcons.register, path: '/patient-registration', step: 1 },
      { title: 'Doctor Assigning', icon: svgIcons.assign, path: '/doctor-assigning', step: 2 },
      { title: 'Vitals', icon: svgIcons.vitals, path: '/vitals', step: 3, queueType: 'vitals' },
    ],
  },
  {
    title: 'Clinical Workflow',
    description: 'Consultation and prescriptions',
    color: '#059669',
    cards: [
      { title: 'Doctor Consultation', icon: svgIcons.consultation, path: '/counsultation', step: 4, queueType: 'consultation' },
      { title: 'Doctor Prescription', icon: svgIcons.prescription, path: '/doctor-prescription', step: 5 },
      { title: 'Counselling', icon: svgIcons.counselling, path: '/counselling', step: 7 },
    ],
  },
  {
    title: 'Distribution',
    description: 'Medicine and food services',
    color: '#d97706',
    cards: [
      { title: 'Stock Update', icon: svgIcons.medicine, path: '/medicine-pickup', step: 6 },
      { title: 'Food', icon: svgIcons.food, path: '/food', step: 8 },
    ],
  },
  {
    title: 'Lookup & Status',
    description: 'Search and track patients',
    color: '#7c3aed',
    cards: [
      { title: 'Search Patient', icon: svgIcons.search, path: '/patient-search', step: 9 },
      { title: 'Patient Status', icon: svgIcons.status, path: '/patient-status', step: 10 },
    ],
  },
];

/* ── Dashboard Card ─────────────────────────────────────── */
const DashboardCard = ({ title, icon, step, queueType, onViewQueue, sectionColor }) => (
  <div className="dashboard-card" style={{ '--card-accent': sectionColor }}>
    <div className="dashboard-card-icon-svg" style={{ color: sectionColor, background: `${sectionColor}12` }}>
      {icon}
    </div>
    <div className="dashboard-card-content">
      <span className="dashboard-card-step" style={{ color: sectionColor }}>Step {step}</span>
      <h3>{title}</h3>
    </div>
    <div className="dashboard-card-actions">
      {queueType && (
        <button
          className="dashboard-card-queue-btn"
          style={{ background: sectionColor }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewQueue(queueType); }}
        >
          View Queue
        </button>
      )}
      <div className="dashboard-card-arrow" style={{ color: sectionColor }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  </div>
);

/* ── Main Component ─────────────────────────────────────── */
function Dashboard() {
  const { openScanner } = useQrScanner();
  const navigate = useNavigate();
  const [scannedBookNumber, setScannedBookNumber] = useState('');
  const [userName, setUserName] = useState('Volunteer');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('userName');
    if (stored) setUserName(stored);
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setDateStr(new Date().toLocaleDateString(undefined, opts));
  }, []);

  const handleViewQueue = (type) => navigate(`/view-queues/${type}`);

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
            <span>Healthcare</span>
          </div>
        </div>

        <button
          className="dashboard-sidebar-logout"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        <header className="dashboard-header">
          <div className="dashboard-greeting">
            <h1>Welcome, {userName}!</h1>
            <p>{dateStr || 'Ready to assist patients today?'}</p>
          </div>
        </header>

        <div className="dashboard-actions">
          <Link to="/volunteer-manual" className="volunteer-manual-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Volunteer Manual
          </Link>
          {scannedBookNumber && (
            <p className="scanned-number-display">
              Scanned Book: {scannedBookNumber}
            </p>
          )}
        </div>

        {/* Grouped workflow sections */}
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
                <Link
                  to={card.path}
                  key={cIdx}
                  className="dashboard-card-link"
                  state={{ bookNumber: scannedBookNumber }}
                >
                  <DashboardCard
                    title={card.title}
                    icon={card.icon}
                    step={card.step}
                    queueType={card.queueType}
                    onViewQueue={handleViewQueue}
                    sectionColor={section.color}
                  />
                </Link>
              ))}
            </div>
          </div>
        ))}

      </main>
    </div>
  );
}

export default Dashboard;
