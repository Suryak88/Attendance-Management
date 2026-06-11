import MainLayout from "./components/templates/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AttendanceLog from "./pages/Attendance-log";
import LeaveRequest from "./pages/leaveRequest";
import LeaveType from "./pages/Leave-type";
import LeaveApproval from "./pages/LeaveApproval";
import AttendanceCorrection from "./pages/AttendanceCorrection";
import CorrectionApproval from "./pages/CorrectionApproval";
import { Toaster } from "sonner";
import NotFound from "./pages/NotFound";
import AttendanceReport from "./pages/AttendanceReport";
import OvertimeApproval from "./pages/OvertimeApproval";
import OvertimeRequest from "./pages/OvertimeRequest";
import LeaveUsage from "./pages/LeaveUsage";
import UpdateData from "./pages/UpdateData";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add("fonts-loaded");
    });
  }, []);

  return (
    <>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            title: "text-sm xl:text-base",
            toast: "shadow-2xl! outline-2!",
            success: "outline-green-300!",
            error: "outline-red-300!",
            warning: "outline-yellow-300!",
            info: "outline-blue-300!",
          },
        }}
        offset={45}
      />
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
            <Route path="attendanceReport" element={<AttendanceReport />} />
            <Route path="leaveRequest" element={<LeaveRequest />} />
            <Route path="leaveUsage" element={<LeaveUsage />} />
            <Route
              path="leaveApproval"
              element={
                <ProtectedRoute allowedRoles={["SUPERVISOR", "MANAGER"]}>
                  <LeaveApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendanceCorrection"
              element={<AttendanceCorrection />}
            />
            <Route
              path="correctionApproval"
              element={
                <ProtectedRoute allowedRoles={["SUPERVISOR", "MANAGER"]}>
                  <CorrectionApproval />
                </ProtectedRoute>
              }
            />
            <Route path="overtimeRequest" element={<OvertimeRequest />} />
            <Route
              path="overtimeApproval"
              element={
                <ProtectedRoute allowedRoles={["SUPERVISOR", "MANAGER"]}>
                  <OvertimeApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="m-leaveType"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <LeaveType />
                </ProtectedRoute>
              }
            />
            <Route
              path="updateData"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <UpdateData />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
