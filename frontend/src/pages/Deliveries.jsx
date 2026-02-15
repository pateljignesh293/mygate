import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiPackage, FiPlus, FiCheck, FiX } from 'react-icons/fi'

const Deliveries = () => {
  const { user, isResident, isAdmin, isSecurity } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    deliveryPersonName: '',
    deliveryPersonPhone: '',
    company: '',
    trackingNumber: '',
    items: [{ description: '', quantity: 1 }],
    notes: ''
  })

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      const response = await api.get('/deliveries')
      setDeliveries(response.data.deliveries || [])
    } catch (error) {
      toast.error('Error fetching deliveries')
    } finally {
      setLoading(false)
    }
  }

  const handleExpectDelivery = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        deliveryPersonName: formData.deliveryPersonName,
        deliveryPersonPhone: formData.deliveryPersonPhone,
        company: formData.company || undefined,
        trackingNumber: formData.trackingNumber || undefined,
        items: formData.items.filter(i => i.description.trim()),
        notes: formData.notes || undefined
      }
      if (!payload.items.length) payload.items = [{ description: 'Package', quantity: 1 }]
      await api.post('/deliveries/invite', payload)
      toast.success('Delivery expectation added!')
      setShowModal(false)
      setFormData({ deliveryPersonName: '', deliveryPersonPhone: '', company: '', trackingNumber: '', items: [{ description: '', quantity: 1 }], notes: '' })
      fetchDeliveries()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding delivery')
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/deliveries/${id}/approve`)
      toast.success('Delivery approved!')
      fetchDeliveries()
    } catch (error) {
      toast.error('Error approving delivery')
    }
  }

  const handleCheckIn = async (id) => {
    try {
      await api.put(`/deliveries/${id}/check-in`)
      toast.success('Delivery checked in!')
      fetchDeliveries()
    } catch (error) {
      toast.error('Error checking in delivery')
    }
  }

  const handleDeliver = async (id) => {
    try {
      await api.put(`/deliveries/${id}/deliver`)
      toast.success('Marked as delivered!')
      fetchDeliveries()
    } catch (error) {
      toast.error('Error marking delivery')
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-gray-100 text-gray-800'
    }
    return map[status] || 'bg-gray-100 text-gray-800'
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
        <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
        {isResident && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Expect Delivery
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person / Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deliveries.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No deliveries</td></tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d._id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{d.deliveryPersonName}</div>
                    <div className="text-sm text-gray-500">{d.company || d.flatNo}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{d.trackingNumber || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(d.status)}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(isResident || isAdmin) && d.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(d._id)} className="text-green-600 hover:text-green-900 font-medium"><FiCheck className="inline" /> Approve</button>
                        </>
                      )}
                      {(isSecurity || isAdmin) && d.status === 'approved' && (
                        <button onClick={() => handleCheckIn(d._id)} className="text-blue-600 hover:text-blue-900 font-medium">Check In</button>
                      )}
                      {(isResident || isSecurity || isAdmin) && (d.status === 'in_transit' || d.status === 'approved') && (
                        <button onClick={() => handleDeliver(d._id)} className="text-gray-700 hover:text-gray-900 font-medium">Mark Delivered</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Expect Delivery</h2>
            <form onSubmit={handleExpectDelivery} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery person name *</label>
                <input type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.deliveryPersonName} onChange={(e) => setFormData({ ...formData, deliveryPersonName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <input type="tel" required pattern="[0-9]{10}" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.deliveryPersonPhone} onChange={(e) => setFormData({ ...formData, deliveryPersonPhone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tracking number</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.trackingNumber} onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Items (description)</label>
                <input type="text" placeholder="e.g. 2 parcels"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.items[0]?.description} onChange={(e) => setFormData({ ...formData, items: [{ description: e.target.value, quantity: 1 }] })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={2}
                  value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Deliveries
