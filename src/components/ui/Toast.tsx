import React, { useEffect } from 'react'
import { cn } from '../../lib/utils'
import useNotificationStore from '../../stores/notificationStore'

const Toast = () => {
  const { message, type, clearNotification } = useNotificationStore()

  useEffect(() => {
    if (message) {
      const timer = setTimeout(clearNotification, 5000)
      return () => clearTimeout(timer)
    }
  }, [message, clearNotification])

  if (!message) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          'px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300',
          type === 'error' ? 'bg-red-500' : 'bg-green-500'
        )}
      >
        <div className="flex items-center gap-2">
          {type === 'error' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
          )}
          <span>{message}</span>
        </div>
      </div>
    </div>
  )
}

export default Toast
