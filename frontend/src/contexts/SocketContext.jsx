import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket']
      })

      newSocket.on('connect', () => {
        console.log('Socket connected')
        newSocket.emit('join-room', user.id)
      })

      newSocket.on('notification', (notification) => {
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000
        })
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
      }
    }
  }, [isAuthenticated, user])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}
