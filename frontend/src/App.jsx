import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Visitors from './pages/Visitors'
import Deliveries from './pages/Deliveries'
import Vehicles from './pages/Vehicles'
import Notices from './pages/Notices'
import Complaints from './pages/Complaints'
import Payments from './pages/Payments'
import Bookings from './pages/Bookings'
import Profile from './pages/Profile'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/visitors"
                element={
                  <PrivateRoute>
                    <Visitors />
                  </PrivateRoute>
                }
              />
              <Route
                path="/deliveries"
                element={
                  <PrivateRoute>
                    <Deliveries />
                  </PrivateRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <PrivateRoute>
                    <Vehicles />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notices"
                element={
                  <PrivateRoute>
                    <Notices />
                  </PrivateRoute>
                }
              />
              <Route
                path="/complaints"
                element={
                  <PrivateRoute>
                    <Complaints />
                  </PrivateRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <PrivateRoute>
                    <Payments />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <PrivateRoute>
                    <Bookings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
