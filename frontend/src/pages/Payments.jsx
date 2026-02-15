import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiCreditCard, FiPlus } from 'react-icons/fi'

const Payments = () => {
  const { user, isResident } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    type: 'maintenance',
    month: new Date().toISOString().slice(0, 7),
    description: ''
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments')
      setPayments(response.data.payments || [])
    } catch (error) {
      toast.error('Error fetching payments')
    } finally {
      setLoading(false)
    }
  }

  const handleMakePayment = async (e) => {
    e.preventDefault()
    const amount = parseFloat(formData.amount)
    if (!amount || amount < 1) {
      toast.error('Enter a valid amount')
      return
    }
    try {
      const response = await api.post('/payments/create-order', {
        amount,
        type: formData.type,
        month: formData.type === 'maintenance' ? formData.month : undefined,
        description: formData.description || undefined
      })
      toast.success(response.data.message || 'Order created. Complete payment via payment gateway.')
      setShowModal(false)
      setFormData({ amount: '', type: 'maintenance', month: new Date().toISOString().slice(0, 7), description: '' })
      fetchPayments()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating payment')
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        {isResident && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Make Payment
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No payments</td></tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="px-6 py-4 whitespace-nowrap">₹{payment.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Make Payment</h2>
            <form onSubmit={handleMakePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₹) *</label>
                <input type="number" min="1" step="0.01" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="maintenance">Maintenance</option>
                  <option value="fine">Fine</option>
                  <option value="amenity_booking">Amenity Booking</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {formData.type === 'maintenance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <input type="month" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Create payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
