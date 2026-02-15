import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiCheck, FiX, FiClock, FiUser } from 'react-icons/fi'

const Visitors = () => {
  const { user, isResident, isSecurity, isAdmin } = useAuth()
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    purpose: 'personal',
    purposeDescription: '',
    numberOfVisitors: 1,
    vehicleNumber: '',
    expectedArrival: ''
  })

  useEffect(() => {
    fetchVisitors()
  }, [])

  const fetchVisitors = async () => {
    try {
      const response = await api.get('/visitors')
      setVisitors(response.data.visitors)
    } catch (error) {
      toast.error('Error fetching visitors')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    try {
      await api.post('/visitors/invite', formData)
      toast.success('Visitor invitation sent!')
      setShowInviteModal(false)
      setFormData({
        name: '',
        phone: '',
        email: '',
        purpose: 'personal',
        purposeDescription: '',
        numberOfVisitors: 1,
        vehicleNumber: '',
        expectedArrival: ''
      })
      fetchVisitors()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error inviting visitor')
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/visitors/${id}/approve`)
      toast.success('Visitor approved!')
      fetchVisitors()
    } catch (error) {
      toast.error('Error approving visitor')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.put(`/visitors/${id}/reject`, { reason: 'Rejected by user' })
      toast.success('Visitor rejected!')
      fetchVisitors()
    } catch (error) {
      toast.error('Error rejecting visitor')
    }
  }

  const handleCheckIn = async (id) => {
    try {
      await api.put(`/visitors/${id}/check-in`)
      toast.success('Visitor checked in!')
      fetchVisitors()
    } catch (error) {
      toast.error('Error checking in visitor')
    }
  }

  const handleCheckOut = async (id) => {
    try {
      await api.put(`/visitors/${id}/check-out`)
      toast.success('Visitor checked out!')
      fetchVisitors()
    } catch (error) {
      toast.error('Error checking out visitor')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      checked_in: 'bg-blue-100 text-blue-800',
      checked_out: 'bg-gray-100 text-gray-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Visitors</h1>
        {isResident && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Invite Visitor
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visitors.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No visitors</td></tr>
            ) : visitors.map((visitor) => (
              <tr key={visitor._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiUser className="mr-2 text-gray-400" />
                    {visitor.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visitor.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visitor.purpose}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(visitor.status)}`}>
                    {visitor.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-2">
                    {(isResident || isAdmin) && visitor.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(visitor._id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                          title="Approve"
                        >
                          <FiCheck className="inline" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(visitor._id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                          title="Reject"
                        >
                          <FiX className="inline" /> Reject
                        </button>
                      </>
                    )}
                    {(isSecurity || isAdmin) && visitor.status === 'approved' && (
                      <button
                        onClick={() => handleCheckIn(visitor._id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Check In
                      </button>
                    )}
                    {(isSecurity || isAdmin) && visitor.status === 'checked_in' && (
                      <button
                        onClick={() => handleCheckOut(visitor._id)}
                        className="text-gray-600 hover:text-gray-900 font-medium"
                      >
                        Check Out
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Invite Visitor</h2>
            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  >
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
                    <option value="delivery">Delivery</option>
                    <option value="service">Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Visitors
