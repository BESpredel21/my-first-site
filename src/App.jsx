import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'))
const EmployeeLoginPage = lazy(() => import('./pages/EmployeeLoginPage'))
const ManagerLoginPage = lazy(() => import('./pages/ManagerLoginPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-500">Загрузка...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<RoleSelectionPage />} />
          <Route path="/login/employee" element={<EmployeeLoginPage />} />
          <Route path="/login/manager" element={<ManagerLoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App