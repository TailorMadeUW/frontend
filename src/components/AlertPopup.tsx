import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  X, 
  Bell, 
  Trash2, 
  Check,
  Calendar as CalendarIcon
} from 'lucide-react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import useAlertStore, { Alert, AlertType } from '../stores/alertStore'
import { cn } from '../lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { Button } from './ui/button'
import useCalendarStore from '../stores/calendarStore'
import { Event } from '../types'

// Utility function to format timestamps
const formatTimestamp = (date: Date) => {
  const isToday = new Date().toDateString() === new Date(date).toDateString()
  return isToday 
    ? `Today at ${format(date, 'h:mm a')}` 
    : formatDistanceToNow(date, { addSuffix: true })
}

// Alert icon mapping
const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />
    case 'error': return <XCircle className="w-5 h-5 text-red-500" />
    case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />
    case 'appointment_suggestion': return <CalendarIcon className="w-5 h-5 text-purple-500" />
    case 'reschedule_request': return <CalendarIcon className="w-5 h-5 text-orange-500" />
    case 'info': default: return <Info className="w-5 h-5 text-blue-500" />
  }
}

// Background color mapping for alerts
const getAlertBackground = (type: AlertType, read: boolean) => {
  if (read) return 'bg-white'
  
  switch (type) {
    case 'success': return 'bg-green-50'
    case 'error': return 'bg-red-50'
    case 'warning': return 'bg-amber-50'
    case 'appointment_suggestion': return 'bg-purple-50'
    case 'reschedule_request': return 'bg-orange-50'
    case 'info': default: return 'bg-blue-50'
  }
}

interface AlertItemProps {
  alert: Alert
  onRead: (id: string) => void
  onRemove: (id: string) => void
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onRead, onRemove }) => {
  const { addEvent, updateEvent, events } = useCalendarStore()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  
  const handleClick = () => {
    if (!alert.read) {
      onRead(alert.id)
    }
  }

  const handleConfirmAppointment = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!alert.metadata) return
    
    const { suggestedStart, suggestedEnd, calendarId, clientName, location, notes, employee } = alert.metadata
    
    // Create new event from the suggestion
    const newEvent: Omit<Event, 'id'> = {
      title: `Appointment with ${employee || 'Provider'}`,
      description: alert.message,
      start: suggestedStart || new Date(),
      end: suggestedEnd || new Date(Date.now() + 1000 * 60 * 30), // Default 30 min
      calendarId: calendarId || 'cal1',
      state: 'busy',
      location: location || '',
      employee: employee || '',
      client: clientName ? { name: clientName } : undefined,
      notes: notes || ''
    }
    
    // Add the event to the calendar
    addEvent(newEvent)
    
    // Mark this alert as read
    onRead(alert.id)
    
    // Store the event ID in sessionStorage to focus on it when Calendar opens
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('focusEventId', events.length.toString())
    }
  }

  const handleConfirmReschedule = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!alert.metadata) return
    
    const { eventId, suggestedStart, suggestedEnd } = alert.metadata
    
    // Find the existing event to update
    if (eventId) {
      const existingEvent = events.find(e => e.id === eventId)
      
      if (existingEvent) {
        // Update the event with new times
        updateEvent(eventId, {
          ...existingEvent,
          start: suggestedStart || existingEvent.start,
          end: suggestedEnd || existingEvent.end
        })
        
        // Mark this alert as read
        onRead(alert.id)
        
        // Store the event ID in sessionStorage to focus on it when Calendar opens
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('focusEventId', eventId)
        }
      }
    }
  }

  const getAlertActions = () => {
    switch (alert.type) {
      case 'appointment_suggestion':
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            <Button 
              onClick={handleConfirmAppointment}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Confirm Appointment
            </Button>
            <Link 
              to="/app/calendar" 
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={(e) => {
                // Store the suggested times in sessionStorage to pre-fill the event form
                if (alert.metadata && typeof window !== 'undefined') {
                  const formData = JSON.stringify({
                    start: alert.metadata.suggestedStart,
                    end: alert.metadata.suggestedEnd,
                    title: `Appointment with ${alert.metadata.employee || 'Provider'}`,
                    location: alert.metadata.location,
                    notes: alert.metadata.notes,
                    clientName: alert.metadata.clientName,
                    employee: alert.metadata.employee,
                    calendarId: alert.metadata.calendarId || 'cal1'
                  })
                  window.sessionStorage.setItem('newEventData', formData)
                }
                
                onRead(alert.id)
              }}
            >
              View Calendar
            </Link>
          </div>
        )
      case 'reschedule_request':
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            <Button 
              onClick={handleConfirmReschedule}
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Confirm New Time
            </Button>
            <Link 
              to="/app/calendar" 
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => {
                // Focus on the original event in the calendar
                if (alert.metadata?.eventId && typeof window !== 'undefined') {
                  window.sessionStorage.setItem('focusEventId', alert.metadata.eventId)
                }
                
                onRead(alert.id)
              }}
            >
              View Calendar
            </Link>
          </div>
        )
      default:
        return alert.actionUrl && alert.actionLabel ? (
          <Link 
            to={alert.actionUrl} 
            className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {alert.actionLabel}
          </Link>
        ) : null
    }
  }

  return (
    <div 
      className={cn(
        "relative p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer",
        getAlertBackground(alert.type, alert.read)
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getAlertIcon(alert.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className={cn(
              "font-medium",
              !alert.read && "font-semibold"
            )}>
              {alert.title}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatTimestamp(alert.timestamp)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
          
          {/* Display suggested time for appointment-related alerts */}
          {(alert.type === 'appointment_suggestion' || alert.type === 'reschedule_request') && alert.metadata && (
            <div className="text-sm text-gray-700 mt-2 border-l-2 border-gray-300 pl-2">
              <div>
                <span className="font-medium">Date: </span>
                {alert.metadata.suggestedStart && format(new Date(alert.metadata.suggestedStart), 'MMMM d, yyyy')}
              </div>
              <div>
                <span className="font-medium">Time: </span>
                {alert.metadata.suggestedStart && format(new Date(alert.metadata.suggestedStart), 'h:mm a')} - 
                {alert.metadata.suggestedEnd && format(new Date(alert.metadata.suggestedEnd), 'h:mm a')}
              </div>
              {alert.metadata.location && (
                <div>
                  <span className="font-medium">Location: </span>
                  {alert.metadata.location}
                </div>
              )}
            </div>
          )}
          
          {getAlertActions()}
        </div>
      </div>
      
      <button 
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(alert.id)
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

const AlertPopup: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const { 
    alerts, 
    unreadCount, 
    isOpen, 
    toggleOpen, 
    setOpen,
    markAsRead,
    markAllAsRead,
    removeAlert,
    clearAllAlerts
  } = useAlertStore()
  
  const popupRef = useRef<HTMLDivElement>(null)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setOpen])

  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, setOpen])

  if (isMobile && isOpen) {
    // Mobile view: full screen modal
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-center items-start">
        <div 
          ref={popupRef}
          className="bg-white w-full h-full max-h-full flex flex-col rounded-t-lg mt-12 overflow-hidden"
        >
          <div className="flex justify-between items-center border-b px-4 py-3 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-blue-600 text-white text-xs font-medium rounded-full h-5 min-w-5 px-1.5">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark all as read</span>
                </button>
              )}
              <button 
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {alerts.length > 0 ? (
              <>
                {alerts.map(alert => (
                  <AlertItem 
                    key={alert.id} 
                    alert={alert}
                    onRead={markAsRead}
                    onRemove={removeAlert}
                  />
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mb-2" />
                <p>No notifications</p>
              </div>
            )}
          </div>
          
          {alerts.length > 0 && (
            <div className="border-t px-4 py-3 bg-white sticky bottom-0">
              <button 
                onClick={clearAllAlerts}
                className="text-sm text-red-600 flex items-center gap-1.5 hover:bg-red-50 px-3 py-1.5 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all notifications</span>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Desktop view: popup dropdown
  return (
    <>
      {isOpen && (
        <div 
          ref={popupRef}
          className="absolute top-12 right-0 w-[400px] max-h-[600px] bg-white rounded-lg shadow-lg border flex flex-col overflow-hidden z-50"
        >
          <div className="flex justify-between items-center border-b px-4 py-3 bg-white sticky top-0 z-10">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(600px-120px)]">
            {alerts.length > 0 ? (
              <>
                {alerts.map(alert => (
                  <AlertItem 
                    key={alert.id} 
                    alert={alert}
                    onRead={markAsRead}
                    onRemove={removeAlert}
                  />
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center p-6 text-gray-500">
                <Bell className="w-10 h-10 text-gray-300 mb-2" />
                <p>No notifications</p>
              </div>
            )}
          </div>
          
          {alerts.length > 0 && (
            <div className="border-t px-4 py-3 bg-white sticky bottom-0">
              <button 
                onClick={clearAllAlerts}
                className="text-sm text-red-600 flex items-center gap-1.5 hover:bg-red-50 px-3 py-1.5 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all notifications</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default AlertPopup 