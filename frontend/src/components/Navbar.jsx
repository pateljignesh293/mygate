import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiHome, FiUsers, FiPackage, FiTruck, FiBell, FiFileText, FiCreditCard, FiCalendar, FiUser, FiLogOut } from 'react-icons/fi'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated) return null

  const navItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/visitors', icon: FiUsers, label: 'Visitors' },
    { path: '/deliveries', icon: FiPackage, label: 'Deliveries' },
    { path: '/vehicles', icon: FiTruck, label: 'Vehicles' },
    { path: '/notices', icon: FiBell, label: 'Notices' },
    { path: '/complaints', icon: FiFileText, label: 'Complaints' },
    { path: '/payments', icon: FiCreditCard, label: 'Payments' },
    { path: '/bookings', icon: FiCalendar, label: 'Bookings' }
  ]

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
                MyGate
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
                >
                  <item.icon className="mr-2" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center text-gray-700 hover:text-primary-600"
            >
              <FiUser className="mr-2" />
              <span className="hidden md:inline">{user?.name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-700 hover:text-red-600"
            >
              <FiLogOut className="mr-2" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
