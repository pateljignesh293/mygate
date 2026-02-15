import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiFileText, FiPlus } from 'react-icons/fi'

const Complaints = () => {
  const { user, isResident, isAdmin } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusModal, setStatusModal] = useState(null)
  const [assignModal, setAssignModal] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  })
  const [statusForm, setStatusForm] = useState({ status: '', resolution: '', message: '' })
  const [assignTo, setAssignTo] = useState('')

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints')
      setComplaints(response.data.complaints || [])
    } catch (error) {
      toast.error('Error fetching complaints')
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async (societyId) => {
    if (!societyId) return
    try {
      const response = await api.get(`/societies/${societyId}/staff`)
      setStaff(response.data.staff || [])
    } catch (error) {
      setStaff([])
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/complaints', formData)
      toast.success('Complaint submitted!')
      setShowModal(false)
      setFormData({ title: '', description: '', category: 'other', priority: 'medium' })
      fetchComplaints()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting complaint')
    }
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!statusModal) return
    try {
      await api.put(`/complaints/${statusModal._id}/status`, {
        status: statusForm.status,
        resolution: statusForm.resolution,
        message: statusForm.message
      })
      toast.success('Status updated!')
      setStatusModal(null)
      setStatusForm({ status: '', resolution: '', message: '' })
      fetchComplaints()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating status')
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignModal || !assignTo) return
    try {
      await api.put(`/complaints/${assignModal._id}/assign`, { assignedTo: assignTo })
      toast.success('Complaint assigned!')
      setAssignModal(null)
      setAssignTo('')
      fetchComplaints()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error assigning')
    }
  }

  const openAssignModal = (complaint) => {
    setAssignModal(complaint)
    setAssignTo(complaint.assignedTo?._id || '')
    fetchStaff(complaint.societyId)
  }

  const getStatusBadge = (status) => {
    const map = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800'
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
        <h1 className="text-3xl font-bold text-gray-900">Complaints & Help Desk</h1>
        {isResident && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Raise Complaint
          </button>
        )}
      </div>

      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">No complaints.</div>
        ) : (
          complaints.map((complaint) => (
            <div key={complaint._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <FiFileText className="text-primary-600 flex-shrink-0" />
                    <h3 className="text-xl font-semibold">{complaint.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(complaint.status)}`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{complaint.description}</p>
                  <p className="text-sm text-gray-500">
                    Category: {complaint.category} | Priority: {complaint.priority}
                    {complaint.assignedTo && ` | Assigned to: ${complaint.assignedTo.name}`}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setStatusModal(complaint); setStatusForm({ status: complaint.status, resolution: complaint.resolution || '', message: '' }) }}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Update Status
                    </button>
                    <button
                      onClick={() => openAssignModal(complaint)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Raise Complaint</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="amenities">Amenities</option>
                  <option value="billing">Billing</option>
                  <option value="noise">Noise</option>
                  <option value="parking">Parking</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Update Status: {statusModal.title}</h2>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Resolution (optional)</label>
                <textarea rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={statusForm.resolution} onChange={(e) => setStatusForm({ ...statusForm, resolution: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message (optional)</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={statusForm.message} onChange={(e) => setStatusForm({ ...statusForm, message: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStatusModal(null)} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Assign: {assignModal.title}</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign to</label>
                <select required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                  <option value="">Select staff</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAssignModal(null)} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Complaints
