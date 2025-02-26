import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type AlertType = 'success' | 'error' | 'info' | 'warning'

export interface Alert {
  id: string
  title: string
  message: string
  type: AlertType
  read: boolean
  timestamp: Date
  actionUrl?: string
  actionLabel?: string
}

interface AlertState {
  alerts: Alert[]
  unreadCount: number
  isOpen: boolean
  
  // Actions
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeAlert: (id: string) => void
  clearAllAlerts: () => void
  toggleOpen: () => void
  setOpen: (isOpen: boolean) => void
}

const useAlertStore = create<AlertState>((set) => ({
  alerts: [
    // Sample alerts for development
    {
      id: '1',
      title: 'New Appointment',
      message: 'You have a new appointment scheduled for tomorrow at 3:00 PM',
      type: 'info',
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      actionUrl: '/app/appointment',
      actionLabel: 'View Appointment'
    },
    {
      id: '2',
      title: 'Payment Received',
      message: 'You received a payment of $120.00 from John Doe',
      type: 'success',
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      actionUrl: '/app/payment',
      actionLabel: 'View Payment'
    },
    {
      id: '3',
      title: 'Client Request',
      message: 'Sarah Smith requested to reschedule her appointment',
      type: 'warning',
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      actionUrl: '/app/clients',
      actionLabel: 'View Client'
    },
    {
      id: '4',
      title: 'System Update',
      message: 'The system will be down for maintenance tonight from 2:00 AM to 4:00 AM',
      type: 'error',
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    }
  ],
  unreadCount: 2,
  isOpen: false,

  addAlert: (alert) => set((state) => {
    const newAlert: Alert = {
      ...alert,
      id: uuidv4(),
      timestamp: new Date(),
      read: false
    }
    
    return {
      alerts: [newAlert, ...state.alerts],
      unreadCount: state.unreadCount + 1
    }
  }),

  markAsRead: (id) => set((state) => {
    const alerts = state.alerts.map(alert => 
      alert.id === id && !alert.read 
        ? { ...alert, read: true } 
        : alert
    )
    
    const unreadCount = alerts.filter(alert => !alert.read).length
    
    return { alerts, unreadCount }
  }),

  markAllAsRead: () => set((state) => ({
    alerts: state.alerts.map(alert => ({ ...alert, read: true })),
    unreadCount: 0
  })),

  removeAlert: (id) => set((state) => {
    const alerts = state.alerts.filter(alert => alert.id !== id)
    const unreadCount = alerts.filter(alert => !alert.read).length
    
    return { alerts, unreadCount }
  }),

  clearAllAlerts: () => set({ alerts: [], unreadCount: 0 }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  
  setOpen: (isOpen) => set({ isOpen })
}))

export default useAlertStore 