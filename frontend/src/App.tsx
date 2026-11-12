import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/auth/AuthLayout";
import DoctorLayout from "./components/doctor/DoctorLayout";
import AccessHistory from "./pages/doctor/AccessHistory";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import PatientRecords from "./pages/doctor/PatientRecords";
import RecentPatients from "./pages/doctor/RecentPatients";
import ScanPatientQR from "./pages/doctor/ScanPatientQR";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthLayout />} />
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="scan" element={<ScanPatientQR />} />
          <Route path="patients/:patientId" element={<PatientRecords />} />
          <Route path="recent-patients" element={<RecentPatients />} />
          <Route path="access-history" element={<AccessHistory />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;