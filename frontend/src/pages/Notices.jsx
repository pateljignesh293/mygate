import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiBell, FiPlus } from 'react-icons/fi'

const Notices = () => {
  const { user, isAdmin } = useAuth()
  const [notices, setNotices] = useState([])
  const [societies, setSocieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'notice',
    priority: 'medium',
    societyId: ''
  })

  useEffect(() => {
    fetchNotices()
    if (isAdmin) fetchSocieties()
  }, [isAdmin])

  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices')
      setNotices(response.data.notices || [])
    } catch (error) {
      toast.error('Error fetching notices')
    } finally {
      setLoading(false)
    }
  }

  const fetchSocieties = async () => {
    try {
      const response = await api.get('/societies')
      setSocieties(response.data.societies || [])
      if (user?.role === 'super_admin' && response.data.societies?.length && !formData.societyId) {
        setFormData(f => ({ ...f, societyId: response.data.societies[0]._id }))
      } else if (user?.societyId) {
        setFormData(f => ({ ...f, societyId: user.societyId }))
      }
    } catch (error) {
      console.error('Error fetching societies', error)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData }
      if (user?.role !== 'super_admin') delete payload.societyId
      await api.post('/notices', payload)
      toast.success('Notice created!')
      setShowModal(false)
      setFormData({ title: '', content: '', type: 'notice', priority: 'medium', societyId: formData.societyId })
      fetchNotices()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating notice')
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
        <h1 className="text-3xl font-bold text-gray-900">Notices & Announcements</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Create Notice
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">No notices yet.</div>
        ) : (
          notices.map((notice) => (
            <div key={notice._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <FiBell className="text-primary-600 flex-shrink-0" />
                    <h3 className="text-xl font-semibold">{notice.title}</h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                      {notice.type}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 whitespace-pre-wrap">{notice.content}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Notice</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {user?.role === 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Society *</label>
                  <select required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.societyId} onChange={(e) => setFormData({ ...formData, societyId: e.target.value })}>
                    <option value="">Select society</option>
                    {societies.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content *</label>
                <textarea required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="notice">Notice</option>
                  <option value="announcement">Announcement</option>
                  <option value="event">Event</option>
                  <option value="maintenance">Maintenance</option>
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
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notices
