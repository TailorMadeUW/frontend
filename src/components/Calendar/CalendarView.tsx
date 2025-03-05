import React, { useRef, useState, useEffect, MouseEvent } from 'react'
import Calendar from '@toast-ui/react-calendar'
import '@toast-ui/calendar/dist/toastui-calendar.min.css'
import useCalendarStore from '../../stores/calendarServerStore'
import useNotificationStore from '../../stores/notificationStore'
import { CalendarManagement } from './CalendarManagement'
import EventFormDialog from './EventFormDialog'
import EventViewDialog from './EventViewDialog'
import { Event } from '../../types'
import type { EventObject, Options, ViewType } from '@toast-ui/calendar'
import { Button } from '../ui/button'
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

type CalendarEvent = Omit<Event, 'id'> & { id?: string }

const CalendarView: React.FC = () => {
  const { events, calendars, addEvent, updateEvent, deleteEvent } = useCalendarStore()
  const { showNotification } = useNotificationStore()
  const calendarRef = useRef<any>(null)
  const [showCalendarManagement, setShowCalendarManagement] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [zoomLevel, setZoomLevel] = useState(isMobile ? 0.6 : 1)
  const [newEventFormData, setNewEventFormData] = useState<Partial<Event> | null>(null)
  const [currentViewDate, setCurrentViewDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<ViewType>('week')
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640
      if (mobile !== isMobile) {
        setIsMobile(mobile)
        if (calendarRef.current) {
          const instance = calendarRef.current.getInstance()
          instance.setOptions({
            week: {
              ...instance.getOptions().week,
              dayNames: mobile 
                ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            },
            month: {
              ...instance.getOptions().month,
              dayNames: mobile 
                ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            }
          })
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640
      const extraSmallScreen = window.innerWidth < 380
      
      if (mobile) {
        setZoomLevel(extraSmallScreen ? 0.55 : 0.6)
      } else {
        setZoomLevel(1)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize() // Call initially to set the correct zoom level
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Set up event handlers when calendar is mounted
  useEffect(() => {
    if (calendarRef.current) {
      const instance = calendarRef.current.getInstance()
      
      // Handle existing event clicks
      instance.on('clickEvent', (eventData: any) => {
        console.log('Raw event data from calendar click:', JSON.stringify(eventData.event, null, 2))
        
        // Parse the event data from Toast UI format
        const event = eventData.event
        
        // Handle both nested date format and direct Date objects
        const getDate = (dateField: any): Date => {
          if (dateField instanceof Date) return dateField
          if (dateField.d?.d) return new Date(dateField.d.d)
          if (typeof dateField === 'string') return new Date(dateField)
          return new Date()
        }

        const start = getDate(event.start)
        const end = getDate(event.end)
        
        // Find the matching event in our store by matching title and time
        // (since IDs may not match between the calendar and our store)
        const storeEvent = events.find(e => {
          const eStart = new Date(e.start)
          const eEnd = new Date(e.end)
          
          // Match by title and approximate time (within 1 minute)
          return e.title === event.title && 
                 Math.abs(eStart.getTime() - start.getTime()) < 60000 && 
                 Math.abs(eEnd.getTime() - end.getTime()) < 60000
        })
        
        console.log('Store event matching search:', storeEvent ? 
          JSON.stringify({
            ...storeEvent,
            start: storeEvent.start instanceof Date ? storeEvent.start.toISOString() : String(storeEvent.start),
            end: storeEvent.end instanceof Date ? storeEvent.end.toISOString() : String(storeEvent.end),
          }, null, 2) : 'No matching event found')
        
        // Create an event object with our format, using store data preferentially
        const parsedEvent: Event = {
          id: storeEvent?.id || event.id, // Use store ID if available
          title: event.title || '',
          description: event.body || storeEvent?.description || '',
          start,
          end,
          calendarId: event.calendarId || storeEvent?.calendarId || 'cal1',
          location: event.location || storeEvent?.location || '',
          employee: storeEvent?.employee || event.employee || '',
          client: storeEvent?.client || event.client,
          notes: storeEvent?.notes || event.notes || '',
          state: storeEvent?.state || event.state || 'busy'
        }

        console.log('Parsed event with all fields (before setting to selectedEvent):', JSON.stringify({
          ...parsedEvent,
          start: parsedEvent.start.toISOString(),
          end: parsedEvent.end.toISOString(),
          client: parsedEvent.client ? 'Has client data' : 'No client data'
        }, null, 2))
        
        setSelectedEvent(parsedEvent)
        setIsViewDialogOpen(true)
      })

      // Handle new event creation via click or drag
      instance.on('beforeCreateEvent', (eventData: any) => {
        const startDate = new Date(eventData.start.getTime())
        const endDate = new Date(eventData.end.getTime())
        setSelectedDate(startDate)
        setSelectedEvent({
          id: String(Date.now()),
          title: '',
          description: '',
          start: startDate,
          end: endDate,
          calendarId: calendars.length > 0 ? calendars[0].id : 'cal1',
          state: 'busy',
          location: '',
          employee: '',
          client: undefined,
          notes: ''
        })
        setIsFormDialogOpen(true)
        return false // Prevent default form
      })

      // Update current view date when navigation happens
      instance.on('dateChange', (eventData: any) => {
        setCurrentViewDate(new Date(eventData.date))
      })
    }
  }, [events])

  const calendarOptions: Options = {
    defaultView: 'week',
    usageStatistics: false,
    useDetailPopup: false,
    useFormPopup: false,
    isReadOnly: false,
    week: {
      startDayOfWeek: 0,
      dayNames: isMobile ? ['', '', '', '', '', '', ''] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workweek: false,
      showNowIndicator: true,
      hourStart: 0,
      hourEnd: 24,
      taskView: false,
      eventView: ['time'],
      collapseDuplicateEvents: true
    },
    month: {
      dayNames: isMobile ? ['', '', '', '', '', '', ''] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      isAlways6Weeks: false,
      visibleEventCount: 4
    },
    calendars: calendars.map(cal => ({
      id: cal.id,
      name: cal.name,
      color: cal.color,
      backgroundColor: `${cal.color}20`,
      borderColor: cal.color,
    })),
  }

  const formatEvents = (events: Event[]) => {
    console.log('Formatting events:', events, calendars)
    const formattedEvents = events.filter(event => {

      // This logic is not working properly right now so comment it out
      const calendar = calendars.find(cal => cal.id === event.calendarId)
      return true
    }).map(event => {
      const formattedEvent = {
        ...event,
        isAllday: false,
        category: 'time' as const,
        body: event.description || '',
        location: event.location || '',
        employee: event.employee || '',
        client: event.client,
        notes: event.notes || '',
        state: event.state || 'busy'
      } as EventObject
      console.log('Formatted event:', JSON.stringify(formattedEvent, null, 2))
      return formattedEvent
    })
    return formattedEvents
  }

  const changeView = (viewType: ViewType) => {
    if (calendarRef.current) {
      calendarRef.current.getInstance().changeView(viewType)
      setCurrentView(viewType)
    }
  }

  const handleEventClick = (event: MouseEvent) => {
    const eventInstance = (event as any).event as Event
    setSelectedEvent(eventInstance)
    setIsViewDialogOpen(true)
  }

  const handleEditEvent = () => {
    console.log('Edit button clicked, selectedEvent (before opening form dialog):', JSON.stringify(selectedEvent && {
      ...selectedEvent,
      start: selectedEvent.start.toISOString(),
      end: selectedEvent.end.toISOString(),
      client: selectedEvent.client ? {
        name: selectedEvent.client.name,
        avatar: selectedEvent.client.avatar
      } : null
    }, null, 2))
    
    // Double-check that we have the most complete version of the event from our store
    if (selectedEvent) {
      // Find matching event in store by ID (we should have the correct ID now)
      const storeEvent = events.find(e => e.id === selectedEvent.id);
      
      if (storeEvent) {
        console.log('Found matching event in store for edit:', JSON.stringify({
          ...storeEvent,
          start: storeEvent.start instanceof Date ? storeEvent.start.toISOString() : String(storeEvent.start),
          end: storeEvent.end instanceof Date ? storeEvent.end.toISOString() : String(storeEvent.end),
        }, null, 2));
        
        // Use the store version instead, which should have all fields
        setSelectedEvent(storeEvent);
      }
    }
    
    setIsViewDialogOpen(false)
    setIsFormDialogOpen(true)
  }

  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      await deleteEvent(selectedEvent.id)
      
      // Remove from calendar instance
      if (calendarRef.current) {
        const calendarInstance = calendarRef.current.getInstance()
        await calendarInstance.deleteEvent(selectedEvent.id, selectedEvent.calendarId)
      }
      
      showNotification('The event has been deleted successfully.', 'success')
      setIsViewDialogOpen(false)
      setSelectedEvent(null)
    }
  }

  const handleEventFormSubmit = async (eventData: {
    title: string
    description?: string
    start: Date
    end: Date
    calendarId: string
    location?: string
    employee?: string
    client?: {
      name: string
      avatar?: string
    }
    notes?: string
  }) => {
    console.log('Event form submit with data:', JSON.stringify(eventData, null, 2));
    
    if (selectedEvent) {
      // Find the actual event in our store to get the correct ID
      const storeEvent = events.find(e => {
        // Match by title and approximate time (within 1 minute)
        const startDiff = Math.abs(new Date(e.start).getTime() - eventData.start.getTime());
        const endDiff = Math.abs(new Date(e.end).getTime() - eventData.end.getTime());
        
        // Either match by ID or by combination of title and similar times
        return e.id === selectedEvent.id || 
               (e.title === selectedEvent.title && 
                startDiff < 60000 && 
                endDiff < 60000);
      });
      
      console.log('Store event found for update:', storeEvent ? 
        JSON.stringify({
          id: storeEvent.id,
          title: storeEvent.title,
        }, null, 2) : 'No matching event found');
      
      // Update existing event
      const updatedEvent: Event = {
        id: storeEvent?.id || selectedEvent.id,
        title: eventData.title,
        description: eventData.description || selectedEvent.description || '',
        start: eventData.start,
        end: eventData.end,
        calendarId: selectedEvent.calendarId,
        state: selectedEvent.state || 'busy',
        location: eventData.location || selectedEvent.location || '',
        employee: eventData.employee || selectedEvent.employee || '',
        client: eventData.client || selectedEvent.client,
        notes: eventData.notes || selectedEvent.notes || ''
      }
      
      console.log('Updating event with:', JSON.stringify(updatedEvent, null, 2));
      
      // Update store
      await updateEvent(selectedEvent.id, updatedEvent)

      // Update calendar instance
      if (calendarRef.current) {
        const calendarInstance = calendarRef.current.getInstance()
        await calendarInstance.updateEvent(selectedEvent.id, selectedEvent.calendarId, {
          id: selectedEvent.id,
          calendarId: selectedEvent.calendarId,
          title: updatedEvent.title,
          body: updatedEvent.description || '',
          start: updatedEvent.start,
          end: updatedEvent.end,
          location: updatedEvent.location || '',
          employee: updatedEvent.employee || '',
          client: updatedEvent.client,
          notes: updatedEvent.notes || '',
          state: updatedEvent.state || 'busy'
        })
      }

      showNotification('The event has been updated successfully.', 'success')
    } else {
      // Create new event with a consistent ID
      const eventId = String(Date.now())
      const newEvent: Event = {
        ...eventData,
        id: eventId,
        calendarId: 'cal1',
        state: 'busy'
      }
      
      // Update store
      await addEvent(newEvent)

      // Create event in calendar instance
      if (calendarRef.current) {
        const calendarInstance = calendarRef.current.getInstance()
        calendarInstance.createEvents([{
          id: eventId,
          calendarId: 'cal1',
          title: eventData.title,
          body: eventData.description || '',
          start: eventData.start,
          end: eventData.end,
          location: eventData.location || '',
          employee: eventData.employee || '',
          client: eventData.client,
          notes: eventData.notes || '',
          state: 'busy'
        }])
      }

      showNotification('The event has been created successfully.', 'success')
    }
    setIsFormDialogOpen(false)
    setSelectedEvent(null)
  }

  const createNewEvent = () => {
    setSelectedEvent(null)
    setSelectedDate(new Date())
    setIsFormDialogOpen(true)
  }

  // Navigate to previous week/month/day
  const navigatePrevious = () => {
    if (calendarRef.current) {
      const instance = calendarRef.current.getInstance()
      instance.prev()
    }
  }

  // Navigate to next week/month/day
  const navigateNext = () => {
    if (calendarRef.current) {
      const instance = calendarRef.current.getInstance()
      instance.next()
    }
  }

  // Navigate to today
  const navigateToday = () => {
    if (calendarRef.current) {
      const instance = calendarRef.current.getInstance()
      instance.today()
    }
  }

  // Handle zoom in/out for calendar on mobile
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5))
  }

  // Format the current date for display
  const getFormattedViewDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long',
      year: 'numeric'
    }
    return new Intl.DateTimeFormat('en-US', options).format(currentViewDate)
  }

  const testScenarios = [
    {
      name: 'Test Error Notification',
      action: () => showNotification('This is a test error message', 'error')
    },
    {
      name: 'Test Success Notification',
      action: () => showNotification('This is a test success message', 'success')
    },
    {
      name: 'Create Test Event',
      action: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0)
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0)

        calendarRef.current?.createEvents([{
          id: String(Date.now()),
          calendarId: 'cal1',
          title: 'Test Appointment',
          start,
          end,
          location: '123 Main St, Suite 100',
          employee: 'John Smith',
          client: {
            name: 'Jane Doe',
            avatar: '/placeholder-avatar.jpg'
          },
          notes: 'This is a test appointment with detailed notes.\nPlease review before the meeting.'
        }])

        showNotification('A test event has been added to the calendar.', 'success')
      }
    }
  ]

  return (
    <div className="flex flex-col w-full h-full rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b">
        <div className="flex items-center justify-between gap-2">
          {/* Date Display */}
          <div className="text-lg font-medium">
            {getFormattedViewDate()}
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={navigatePrevious}
              className="p-1 sm:p-2 h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={navigateToday}
              className="text-xs px-2 py-1 h-7"
            >
              Today
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={navigateNext}
              className="p-1 sm:p-2 h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* View Controls */}
          <div className="flex overflow-hidden rounded-md">
            <Button 
              size="sm" 
              variant={currentView === 'day' ? 'default' : 'outline'} 
              onClick={() => changeView('day')}
              className="rounded-none rounded-l-md"
            >
              Day
            </Button>
            <Button 
              size="sm" 
              variant={currentView === 'week' ? 'default' : 'outline'} 
              onClick={() => changeView('week')}
              className="rounded-none border-l-0 border-r-0"
            >
              Week
            </Button>
            <Button 
              size="sm" 
              variant={currentView === 'month' ? 'default' : 'outline'} 
              onClick={() => changeView('month')}
              className="rounded-none rounded-r-md"
            >
              Month
            </Button>
          </div>
        </div>
        
        {/* Secondary Controls */}
        <div className="flex items-center justify-between mt-2">
          {/* Mobile Zoom Controls (Left) */}
          <div className="flex gap-1">
            {isMobile && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleZoomOut}
                  className="px-2 h-7 min-w-7"
                >
                  <span className="text-lg">-</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleZoomIn}
                  className="px-2 h-7 min-w-7"
                >
                  <span className="text-lg">+</span>
                </Button>
              </>
            )}
          </div>
          
          {/* Resource/Event Controls (Right) */}
          <div className="flex gap-1 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCalendarManagement(true)}
              className="text-xs sm:text-sm h-7"
            >
              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              View Calendars
            </Button>
            <Button
              size="sm"
              onClick={createNewEvent}
              className="text-xs sm:text-sm h-7"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Container */}
      <div 
        className="flex-1 min-h-0 w-full p-0 overflow-hidden relative flex flex-col" 
        style={{ 
          height: 'calc(100vh - 110px)', // Fixed height calculation for all devices
          minHeight: '600px', // Ensure minimum height
        }}
      >
        <div 
          className="flex-1 w-full h-full"
          style={{ 
            transform: `scale(${zoomLevel})`, 
            transformOrigin: 'top left',
            width: isMobile ? `${130 / zoomLevel}%` : '100%',  // Increased width compensation for mobile scaling
          }}
        >
          <Calendar
            ref={calendarRef}
            height="100%"
            events={formatEvents(events)}
            {...calendarOptions}
          />
        </div>
      </div>

      {/* Dialogs */}
      <CalendarManagement 
        isOpen={showCalendarManagement}
        onClose={() => setShowCalendarManagement(false)}
      />

      {selectedEvent && (
        <EventViewDialog
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false)
            setSelectedEvent(null)
          }}
          event={selectedEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      <EventFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false)
          setSelectedEvent(null)
        }}
        onSubmit={handleEventFormSubmit}
        initialDate={selectedDate}
        event={selectedEvent || undefined}
      />
    </div>
  )
}

export default CalendarView
