import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiTruck, FiPlus, FiLogIn, FiLogOut } from 'react-icons/fi'

const Vehicles = () => {
  const { user, isResident, isSecurity, isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'car',
    brand: '',
    model: '',
    color: ''
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles')
      setVehicles(response.data.vehicles || [])
    } catch (error) {
      toast.error('Error fetching vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await api.post('/vehicles/register', formData)
      toast.success('Vehicle registered!')
      setShowModal(false)
      setFormData({ vehicleNumber: '', vehicleType: 'car', brand: '', model: '', color: '' })
      fetchVehicles()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error registering vehicle')
    }
  }

  const handleEntry = async (id) => {
    try {
      await api.post(`/vehicles/${id}/entry`, { entryGate: 'Main Gate' })
      toast.success('Entry logged!')
      fetchVehicles()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error logging entry')
    }
  }

  const handleExit = async (id) => {
    try {
      await api.post(`/vehicles/${id}/exit`, { exitGate: 'Main Gate' })
      toast.success('Exit logged!')
      fetchVehicles()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error logging exit')
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
        <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
        {isResident && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Register Vehicle
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No vehicles</td></tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{vehicle.vehicleNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{vehicle.vehicleType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${vehicle.isInside ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {vehicle.isInside ? 'Inside' : 'Outside'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(isSecurity || isAdmin) && (
                      <div className="flex gap-2">
                        {!vehicle.isInside && (
                          <button onClick={() => handleEntry(vehicle._id)} className="inline-flex items-center text-blue-600 hover:text-blue-900 font-medium">
                            <FiLogIn className="mr-1" /> Log Entry
                          </button>
                        )}
                        {vehicle.isInside && (
                          <button onClick={() => handleExit(vehicle._id)} className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium">
                            <FiLogOut className="mr-1" /> Log Exit
                          </button>
                        )}
                      </div>
                    )}
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
            <h2 className="text-2xl font-bold mb-4">Register Vehicle</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Number *</label>
                <input type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md uppercase"
                  value={formData.vehicleNumber} onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })} placeholder="e.g. KA01AB1234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}>
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vehicles
