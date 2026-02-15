import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi'

const Bookings = () => {
  const { user, isResident, isAdmin } = useAuth()
  const [bookings, setBookings] = useState([])
  const [societies, setSocieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    amenity: '',
    amenityId: '',
    slotDate: '',
    startTime: '',
    endTime: '',
    numberOfGuests: 0,
    notes: ''
  })

  useEffect(() => {
    fetchBookings()
    if (isResident) fetchSocieties()
  }, [isResident])

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings')
      setBookings(response.data.bookings || [])
    } catch (error) {
      toast.error('Error fetching bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchSocieties = async () => {
    try {
      const response = await api.get('/societies')
      setSocieties(response.data.societies || [])
    } catch (error) {
      console.error('Error fetching societies', error)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const slotDate = formData.slotDate || new Date().toISOString().slice(0, 10)
      const start = new Date(`${slotDate}T${formData.startTime}`)
      const end = new Date(`${slotDate}T${formData.endTime}`)
      await api.post('/bookings', {
        amenity: formData.amenity,
        amenityId: formData.amenityId || undefined,
        slotDate,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        numberOfGuests: formData.numberOfGuests || 0,
        notes: formData.notes || undefined
      })
      toast.success('Booking requested!')
      setShowModal(false)
      setFormData({ amenity: '', amenityId: '', slotDate: '', startTime: '', endTime: '', numberOfGuests: 0, notes: '' })
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating booking')
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await api.put(`/bookings/${id}/cancel`)
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cancelling')
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/bookings/${id}/approve`)
      toast.success('Booking approved!')
      fetchBookings()
    } catch (error) {
      toast.error('Error approving booking')
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):')
    try {
      await api.put(`/bookings/${id}/reject`, { reason: reason || undefined })
      toast.success('Booking rejected')
      fetchBookings()
    } catch (error) {
      toast.error('Error rejecting booking')
    }
  }

  const society = societies[0]
  const amenities = society?.amenities || []

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
        <h1 className="text-3xl font-bold text-gray-900">Amenity Bookings</h1>
        {isResident && amenities.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Book Amenity
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center text-gray-500">No bookings.</div>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <FiCalendar className="text-2xl text-primary-600 mr-3" />
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  booking.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg">{booking.amenity}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(booking.slotDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {booking.amount > 0 && <p className="text-sm text-gray-600 mt-1">₹{booking.amount}</p>}
              <div className="mt-3 flex gap-2">
                {isResident && ['pending', 'approved'].includes(booking.status) && (booking.residentId?._id === user?.id || booking.residentId === user?.id) && (
                  <button onClick={() => handleCancel(booking._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Cancel</button>
                )}
                {isAdmin && booking.status === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(booking._id)} className="text-green-600 hover:text-green-800 text-sm font-medium">Approve</button>
                    <button onClick={() => handleReject(booking._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Reject</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Book Amenity</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amenity *</label>
                <select required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.amenity} onChange={(e) => {
                    const opt = amenities.find(a => a.name === e.target.value)
                    setFormData({ ...formData, amenity: e.target.value, amenityId: opt?._id || '' })
                  }}>
                  <option value="">Select amenity</option>
                  {amenities.map(a => <option key={a._id || a.name} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input type="date" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.slotDate} onChange={(e) => setFormData({ ...formData, slotDate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start time *</label>
                  <input type="time" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End time *</label>
                  <input type="time" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Guests</label>
                <input type="number" min={0} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.numberOfGuests} onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bookings
