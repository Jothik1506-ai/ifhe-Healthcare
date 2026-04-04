import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from "./Components/Navbar";
import AddDoctor from './Pages/AddDoctor';
import AddMedicine from './Pages/AddMedicine';
import Dashboard from './Pages/Dashboard';
import DashboardAdmin from './Pages/DashBoardAdmin';
import DoctorAssigning from './Pages/DoctorAssigning';
import DoctorConsultation from './Pages/DoctorConsultation';
import DoctorAssigningAutomatic from './Pages/DoctorAssigningAutomatic';
import DoctorAvailability from './Pages/DoctorAvailability';
import DoctorPrescription from './Pages/DoctorPrescription';
import MedicinePickup from './Pages/MedicinePickup';
import PatientRegistration from './Pages/PatientRegistration';
import UpdateMedicineStock from './Pages/UpdateMedicineStock';
import ViewDoctors from './Pages/ViewDoctors';
import ViewMedicines from './Pages/ViewMedicines';
import ViewPatients from './Pages/ViewPatients';
import Profiles from './Pages/Profiles';
import ViewQueue from './Pages/ViewQueue';
import ViewDoctorQueues from './Pages/ViewDoctorQueues';
import Vitals from './Pages/Vitals';
import PatientSearch from './Pages/PatientSearch';
// import ExpiredMedicines from './Pages/ExpiredMedicines';
import './App.css';
import Footer from './Components/Footer';
import AddVolunteer from './Pages/AddVolunteer';
import AdminAnalytics from './Pages/AdminAnalytics';
import AdminLabTests from './Pages/AdminLabTests';
import AdminLogin from './Pages/AdminLogin';
import CampAnalytics from './Pages/CampAnalytics';
import CounsellingPage from './Pages/CounsellingPage';
import DoctorProfile from './Pages/DoctorProfile';
import Food from './Pages/Food';
import LabTestsPage from './Pages/LabTestsPage';
import Log from './Pages/Log';
import Login from './Pages/Login';
import PatientProfile from './Pages/PatientProfile';
import PatientStatusPage from './Pages/PatientStatusPage';
import ProtectedRoute from './Pages/ProtectedRoute';
import TokenGeneration from './Pages/TokenGeneration';
import VerifyMedicine from './Pages/VerifyMedicine';
import ViewVolunteers from './Pages/ViewVolunteers';
import VolunteerLogin from './Pages/VolunteerLogin';
import VolunteerManual from './Pages/VolunteerManual';
import VolunteerProfile from './Pages/VolunteerProfile';
import PublicRoute from './Pages/PublicRoute';
import LoginOTP from './Pages/LoginOTP';
import VerifyOTP from './Pages/VerifyOTP';
import { QrScannerProvider } from './Context/QrScannerContext';
import DownloadQRCodes from './Pages/DownloadQRCodes';
import RealTimeAnalytics from './Pages/RealTimeAnalytics';

function App() {
  return (
    <div className="app-container">
      <Router>
        <div className="main-content">
          <QrScannerProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login-otp" element={<PublicRoute><LoginOTP /> </PublicRoute>} />
              <Route path="/verify-otp" element={<PublicRoute><VerifyOTP /> </PublicRoute>} />
              <Route path="/volunteer-signup" element={<AddVolunteer fromLogin={true} />} />
              <Route path="/dashboard" element={<ProtectedRoute requiredType="volunteer"><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard-admin" element={<ProtectedRoute requiredType="admin"><DashboardAdmin /></ProtectedRoute>} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/volunteer-login" element={<VolunteerLogin />} />
              <Route path="/patient-registration" element={<ProtectedRoute requiredType="volunteer"><PatientRegistration /></ProtectedRoute>} />
              <Route path="/vitals" element={<ProtectedRoute requiredType="volunteer"><Vitals /></ProtectedRoute>} />
              <Route path="/token" element={<ProtectedRoute requiredType="volunteer"><TokenGeneration /></ProtectedRoute>} />
              <Route path="/counselling" element={<ProtectedRoute requiredType="volunteer"><CounsellingPage /></ProtectedRoute>} />
              <Route path="/doctor-assigning" element={<ProtectedRoute requiredType="volunteer"><DoctorAssigning /></ProtectedRoute>} />
              <Route path="/doctor-assigning-automatic" element={<ProtectedRoute requiredType="volunteer"><DoctorAssigningAutomatic /></ProtectedRoute>} />
              <Route path="/view-queue" element={<ProtectedRoute requiredType="volunteer"><ViewQueue /></ProtectedRoute>} />
              <Route path="/doctor-prescription" element={<ProtectedRoute requiredType="volunteer"><DoctorPrescription /></ProtectedRoute>} />
              <Route path="/medicine-pickup" element={<ProtectedRoute requiredType="volunteer"><MedicinePickup /></ProtectedRoute>} />
              <Route path="/medicine-verification" element={<ProtectedRoute requiredType="volunteer"><VerifyMedicine /></ProtectedRoute>} />
              <Route path="/log" element={
                <ProtectedRoute requiredType="admin">
                  <Log />
                </ProtectedRoute>
              } />
              <Route path="/add-volunteer" element={<ProtectedRoute requiredType="admin"><AddVolunteer /></ProtectedRoute>} />
              <Route path="/add-doctor" element={<ProtectedRoute requiredType="admin"><AddDoctor /></ProtectedRoute>} />
              <Route path="/doctor-availability" element={<ProtectedRoute requiredType="admin"><DoctorAvailability /></ProtectedRoute>} />
              <Route path="/view-patients" element={<ProtectedRoute requiredType="admin"><ViewPatients /></ProtectedRoute>} />
              <Route path="/get-medicines" element={<ProtectedRoute requiredType="admin"><ViewMedicines /></ProtectedRoute>} />
              <Route path="/update-medicine-stock" element={<ProtectedRoute requiredType="admin"><UpdateMedicineStock /></ProtectedRoute>} />
              <Route path="/add-new-medicine" element={<ProtectedRoute requiredType="admin"><AddMedicine /></ProtectedRoute>} />
              <Route path='/get-doctors' element={<ProtectedRoute requiredType="admin"><ViewDoctors /></ProtectedRoute>} />
              <Route path='/doctor/:id' element={<ProtectedRoute requiredType="admin"><DoctorProfile /></ProtectedRoute>} />
              <Route path="/get-volunteers" element={<ProtectedRoute requiredType="admin"><ViewVolunteers /></ProtectedRoute>} />
              <Route path="/volunteer/:id" element={<ProtectedRoute requiredType="admin"><VolunteerProfile /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute requiredType="admin"><AdminAnalytics /></ProtectedRoute>} />
              <Route path="/camp-analytics" element={<ProtectedRoute requiredType="admin"><CampAnalytics /></ProtectedRoute>} />
              <Route path="/real-time-analytics" element={<ProtectedRoute requiredType="admin"><RealTimeAnalytics /></ProtectedRoute>} />
              <Route path="/patient/:id" element={<ProtectedRoute requiredType="admin"><PatientProfile /></ProtectedRoute>} />
              <Route path="/profiles" element={<ProtectedRoute requiredType="admin"><Profiles /></ProtectedRoute>} />
              <Route path="/patient-status" element={<ProtectedRoute requiredType="volunteer"><PatientStatusPage /></ProtectedRoute>} />
              <Route path="/lab-tests" element={<ProtectedRoute requiredType="volunteer"><LabTestsPage /></ProtectedRoute>} />
              <Route path="/manage-labtests" element={<ProtectedRoute requiredType="admin"><AdminLabTests /></ProtectedRoute>} /> {/* New Admin Lab Tests Route */}
              <Route path="/downloadQrcode" element={<ProtectedRoute requiredType="admin"><DownloadQRCodes /></ProtectedRoute>} />
              <Route path="/food" element={<ProtectedRoute requiredType="volunteer"><Food /></ProtectedRoute>} />
              <Route path="/volunteer-manual" element={<ProtectedRoute requiredType="volunteer"><VolunteerManual /></ProtectedRoute>} />
              <Route path="/counsultation" element={<ProtectedRoute requiredType="volunteer"><DoctorConsultation /></ProtectedRoute>} />
              <Route path="/view-queues/:type" element={<ProtectedRoute requiredType="volunteer"><ViewDoctorQueues /></ProtectedRoute>} />
              <Route path="/patient-search" element={<ProtectedRoute requiredType="volunteer"><PatientSearch /></ProtectedRoute>} />
            </Routes>
          </QrScannerProvider>
        </div>
      </Router>
    </div>
  );
}

export default App;
