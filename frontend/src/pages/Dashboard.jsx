import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { FiUsers, FiPackage, FiTruck, FiBell, FiFileText, FiCreditCard, FiCalendar } from 'react-icons/fi'

const Dashboard = () => {
  const { user, isResident, isAdmin, isSecurity } = useAuth()
  const [stats, setStats] = useState({
    visitors: { pending: 0, today: 0 },
    deliveries: { pending: 0, today: 0 },
    vehicles: { inside: 0 },
    notices: { unread: 0 },
    complaints: { open: 0 },
    payments: { pending: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch visitors
      const visitorsRes = await api.get('/visitors?status=pending').catch(() => ({ data: { count: 0, visitors: [] } }))
      const visitorsTodayRes = await api.get('/visitors/logs/today').catch(() => ({ data: { count: 0, visitors: [] } }))
      
      // Fetch deliveries
      const deliveriesRes = await api.get('/deliveries?status=pending').catch(() => ({ data: { count: 0, deliveries: [] } }))
      
      // Fetch vehicles
      const vehiclesRes = await api.get('/vehicles?isInside=true').catch(() => ({ data: { count: 0, vehicles: [] } }))
      
      // Fetch notices
      const noticesRes = await api.get('/notices').catch(() => ({ data: { count: 0, notices: [] } }))
      
      // Fetch complaints
      const complaintsRes = await api.get('/complaints?status=open').catch(() => ({ data: { count: 0, complaints: [] } }))
      
      // Fetch payments
      const paymentsRes = await api.get('/payments?status=pending').catch(() => ({ data: { count: 0, payments: [] } }))

      setStats({
        visitors: {
          pending: visitorsRes.data?.count ?? visitorsRes.data?.visitors?.length ?? 0,
          today: visitorsTodayRes.data?.count ?? visitorsTodayRes.data?.visitors?.length ?? 0
        },
        deliveries: {
          pending: deliveriesRes.data?.count ?? deliveriesRes.data?.deliveries?.length ?? 0
        },
        vehicles: {
          inside: vehiclesRes.data?.count ?? vehiclesRes.data?.vehicles?.length ?? 0
        },
        notices: {
          unread: noticesRes.data?.count ?? noticesRes.data?.notices?.length ?? 0
        },
        complaints: {
          open: complaintsRes.data?.count ?? complaintsRes.data?.complaints?.length ?? 0
        },
        payments: {
          pending: paymentsRes.data?.count ?? paymentsRes.data?.payments?.length ?? 0
        }
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set defaults on error
      setStats({
        visitors: { pending: 0, today: 0 },
        deliveries: { pending: 0 },
        vehicles: { inside: 0 },
        notices: { unread: 0 },
        complaints: { open: 0 },
        payments: { pending: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Pending Visitors',
      value: stats.visitors.pending,
      icon: FiUsers,
      color: 'bg-blue-500',
      link: '/visitors'
    },
    {
      title: 'Pending Deliveries',
      value: stats.deliveries.pending,
      icon: FiPackage,
      color: 'bg-green-500',
      link: '/deliveries?status=pending'
    },
    {
      title: 'Vehicles Inside',
      value: stats.vehicles.inside,
      icon: FiTruck,
      color: 'bg-purple-500',
      link: '/vehicles?isInside=true'
    },
    {
      title: 'New Notices',
      value: stats.notices.unread,
      icon: FiBell,
      color: 'bg-yellow-500',
      link: '/notices'
    },
    {
      title: 'Open Complaints',
      value: stats.complaints.open,
      icon: FiFileText,
      color: 'bg-red-500',
      link: '/complaints?status=open'
    },
    {
      title: 'Pending Payments',
      value: stats.payments.pending,
      icon: FiCreditCard,
      color: 'bg-indigo-500',
      link: '/payments?status=pending'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          {user?.flatNo && `Flat ${user.flatNo}`} {user?.block && `Block ${user.block}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full`}>
                <card.icon className="text-white text-2xl" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {/* Add recent activity items here */}
          <p className="text-gray-600">No recent activity</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
