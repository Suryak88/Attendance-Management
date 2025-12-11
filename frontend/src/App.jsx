import MainLayout from "./components/templates/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AttendanceLog from "./pages/Attendance-log";
import Correction from "./pages/Correction";
import LeaveType from "./pages/Leave-type";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="attendance-log" element={<AttendanceLog />} />
          <Route path="correction" element={<Correction />} />
          <Route path="m-leaveType" element={<LeaveType />} />
        </Route>
      </Routes>
    </Router>
  );
}
