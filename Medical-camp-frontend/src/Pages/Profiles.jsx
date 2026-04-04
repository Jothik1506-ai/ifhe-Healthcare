import React, { useState } from 'react';
import ViewDoctors from './ViewDoctors';
import ViewPatients from './ViewPatients';
import ViewVolunteers from './ViewVolunteers';
import '../Styles/Profiles.css';

function Profiles() {
    const [activeTab, setActiveTab] = useState('doctors');

    return (
        <div className="profiles-page-container">
            <div className="profiles-header-section">
                <h1>Profiles Management</h1>
                <p>View and manage all user profiles in one place</p>
            </div>

            <div className="profiles-tabs-container">
                <button
                    className={`profile-tab ${activeTab === 'doctors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('doctors')}
                >
                    <span className="tab-icon">👨‍⚕️</span> Doctors
                </button>
                <button
                    className={`profile-tab ${activeTab === 'patients' ? 'active' : ''}`}
                    onClick={() => setActiveTab('patients')}
                >
                    <span className="tab-icon">😷</span> Patients
                </button>
                <button
                    className={`profile-tab ${activeTab === 'volunteers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('volunteers')}
                >
                    <span className="tab-icon">👥</span> Volunteers
                </button>
            </div>

            <div className="profiles-content-area">
                {activeTab === 'doctors' && <div className="tab-content-wrapper"><ViewDoctors /></div>}
                {activeTab === 'patients' && <div className="tab-content-wrapper"><ViewPatients /></div>}
                {activeTab === 'volunteers' && <div className="tab-content-wrapper"><ViewVolunteers /></div>}
            </div>
        </div>
    );
}

export default Profiles;
