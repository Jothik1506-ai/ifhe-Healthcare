import React from 'react';
// import { QRCodeSVG } from 'qrcode.react';
import '../Styles/PatientIDCard.css';

function PatientIDCard({ patientData }) {
  if (!patientData) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  // Generate QR code data - using MongoDB _id
  // const qrData = JSON.stringify({
  //   id: patientData._id,
  //   book_no: patientData.book_no,
  //   name: patientData.patient_name,
  // });

  // Log QR data for debugging
  // console.log('📋 QR Code Data:', qrData);
  console.log('🆔 Patient ID:', patientData._id);

  return (
    <div className="patient-id-card-wrapper">
      <div className="patient-id-card-container">
        <div className="patient-id-card" id="printable-card">
          <div className="id-card-header">
            <h2>Medical Camp</h2>
            <h3>Patient ID Card</h3>
          </div>

          <div className="id-card-body">
            <div className="patient-info">
              <div className="info-row">
                <span className="info-label">Book No:</span>
                <span className="info-value">{patientData.book_no}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{patientData.patient_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Age:</span>
                <span className="info-value">{patientData.patient_age} years</span>
              </div>
              {patientData.patient_sex && (
                <div className="info-row">
                  <span className="info-label">Gender:</span>
                  <span className="info-value">
                    {patientData.patient_sex.charAt(0).toUpperCase() + patientData.patient_sex.slice(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="qr-code-section">
              <img src={patientData.qr} alt="QR Code" />;
              <p className="qr-label">Scan for Quick Access</p>
            </div>
          </div>

          <div className="id-card-footer">
            <p>Patient ID: {patientData._id}</p>
            <p className="issue-date">Issued: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="id-card-actions no-print">
        <button className="print-btn" onClick={handlePrint}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print ID Card
        </button>
      </div>
    </div>
  );
}

export default PatientIDCard;
