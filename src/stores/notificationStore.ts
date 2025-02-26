import { create } from 'zustand'

interface NotificationState {
  message: string | null
  type: 'error' | 'success' | null
  showNotification: (message: string, type: 'error' | 'success') => void
  clearNotification: () => void
}

const useNotificationStore = create<NotificationState>((set) => ({
  message: null,
  type: null,
  showNotification: (message, type) => {
    set({ message, type })
    setTimeout(() => {
      set({ message: null, type: null })
    }, 5000)
  },
  clearNotification: () => set({ message: null, type: null })
}))

export default useNotificationStore
