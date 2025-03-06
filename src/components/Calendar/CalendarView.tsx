import React, { useRef, useState, useEffect, MouseEvent } from 'react'
import Calendar from '@toast-ui/react-calendar'
import '@toast-ui/calendar/dist/toastui-calendar.min.css'
import useCalendarServerStore from '../../stores/calendarServerStore'
import useNotificationStore from '../../stores/notificationStore'
import { CalendarManagement } from './CalendarManagement'
import EventFormDialog from './EventFormDialog'
import EventViewDialog from './EventViewDialog'
import { Event } from '../../types'
import type { EventObject, Options, ViewType } from '@toast-ui/calendar'
import { Button } from '../ui/button'
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { isValid } from 'date-fns'

type CalendarEvent = Omit<Event, 'id'> & { id?: string }

const CalendarView: React.FC = () => {
  const { events, calendars, addEvent, updateEvent, deleteEvent } = useCalendarServerStore()
  const { showNotification } = useNotificationStore()
  const calendarRef = useRef<any>(null)
  const [showCalendarManagement, setShowCalendarManagement] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // Initialize with higher zoom level for mobile
  const getInitialZoomLevel = () => {
    const width = window.innerWidth;
    if (width < 380) return 0.85;
    if (width < 480) return 0.9;
    if (width < 640) return 0.95;
    if (width < 768) return 1.0;
    if (width < 1024) return 1.05;
    return 1.1;
  }
  
  const [zoomLevel, setZoomLevel] = useState(getInitialZoomLevel())
  const [newEventFormData, setNewEventFormData] = useState<Partial<Event> | null>(null)
  const [currentViewDate, setCurrentViewDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<ViewType>(window.innerWidth < 640 ? 'day' : 'week')
  
  // Define screen size breakpoints for responsive design
  const getScreenSizeClass = () => {
    const width = window.innerWidth;
    if (width < 480) return 'xs'; // Extra small
    if (width < 640) return 'sm'; // Small mobile
    if (width < 768) return 'md'; // Medium (tablet)
    if (width < 1024) return 'lg'; // Large (tablet landscape)
    return 'xl'; // Desktop
  }
  
  const [screenSizeClass, setScreenSizeClass] = useState(getScreenSizeClass());
  
  // Update screen size class on resize
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSizeClass(getScreenSizeClass());
    };
    
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  // Define changeView function early using useCallback
  const changeView = React.useCallback((viewType: ViewType) => {
    if (calendarRef.current) {
      // First change the view type
      calendarRef.current.getInstance().changeView(viewType)
      setCurrentView(viewType)
      
      // Then adjust the calendar instance for the new view
      if (viewType === 'day' && isMobile) {
        // Optimize for day view on mobile
        calendarRef.current.getInstance().setOptions({
          week: {
            hourStart: 0,  // Show full 24 hours
            hourEnd: 24,   // Show full 24 hours
          }
        });
        
        // Force a re-render after a brief delay to ensure layout adjusts
        setTimeout(() => {
          if (calendarRef.current) {
            calendarRef.current.getInstance().render();
          }
        }, 100);
      } else {
        // Reset to normal settings for other views
        calendarRef.current.getInstance().setOptions({
          week: {
            hourStart: 0,
            hourEnd: 24,
          }
        });
      }
    }
  }, [calendarRef, isMobile]);
  
  // Initial setup - ensure mobile devices start in day view
  useEffect(() => {
    // This runs only once on component mount since we handle the currentView
    // dependency by using a conditional check inside the effect
    const isMobileDevice = window.innerWidth < 640;
    
    // We use the initial state value directly instead of the currentView from the dependency
    const initialViewType = isMobileDevice ? 'day' : 'week';
    
    // This will force the calendar to render with the correct view based on device
    if (calendarRef.current) {
      setTimeout(() => {
        // Change to the appropriate view
        calendarRef.current.getInstance().changeView(initialViewType);
        setCurrentView(initialViewType);
        
        // If it's mobile and day view, also set the appropriate hour range
        if (isMobileDevice && initialViewType === 'day') {
          calendarRef.current.getInstance().setOptions({
            week: {
              hourStart: 0,  // Show full 24 hours
              hourEnd: 24,   // Show full 24 hours
            }
          });
          
          // Force a re-render to update the layout
          calendarRef.current.getInstance().render();
        }
      }, 200);
    }
  }, [calendarRef]); // Only depend on calendarRef, not currentView
  
  // Handle mobile view change
  useEffect(() => {
    const handleViewportChange = () => {
      const mobile = window.innerWidth < 640;
      // Only change view type if it's currently day or week
      if (mobile && (currentView === 'week')) {
        changeView('day');
      } else if (!mobile && (currentView === 'day')) {
        changeView('week');
      }
    };
    
    window.addEventListener('resize', handleViewportChange);
    return () => window.removeEventListener('resize', handleViewportChange);
  }, [currentView, changeView]);
  
  // Ensure correct view is set on initial render
  useEffect(() => {
    // Check if we need to adjust the view when calendar is ready
    if (calendarRef.current) {
      // Small delay to allow calendar to fully initialize
      setTimeout(() => {
        const mobile = window.innerWidth < 640;
        if (mobile && currentView !== 'day') {
          changeView('day');
        } else if (!mobile && currentView !== 'week') {
          changeView('week');
        }
      }, 100);
    }
  }, [calendarRef, changeView, currentView]);

  useEffect(() => {
    const handleResize = () => {
      // Get appropriate zoom level based on screen size
      let newZoomLevel = 1;
      const width = window.innerWidth;
      
      if (width < 380) {
        newZoomLevel = 0.75; // Extra small screens - increased from 0.55
      } else if (width < 480) {
        newZoomLevel = 0.8;  // Small phones - increased from 0.6
      } else if (width < 640) {
        newZoomLevel = 0.85;  // Large phones - increased from 0.7
      } else if (width < 768) {
        newZoomLevel = 0.9;  // Small tablets
      } else if (width < 1024) {
        newZoomLevel = 0.95;  // Large tablets
      }
      
      setZoomLevel(newZoomLevel);
      setScreenSizeClass(getScreenSizeClass()); // Update screen size class as well
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

  // Add a new useEffect to handle calendar navigation and showing event on mount
  useEffect(() => {
    // Check if we need to focus on a specific event (from ChatWidget)
    const focusEventId = sessionStorage.getItem('focusEventId')
    const calendarDate = sessionStorage.getItem('calendarDate')
    const showEventDialog = sessionStorage.getItem('showEventDialog')
    
    if (focusEventId && calendarRef.current) {
      // Find the event in our store
      const event = events.find(e => e.id === focusEventId)
      
      // Set the date from sessionStorage or from the event
      if (calendarDate) {
        const newDate = new Date(calendarDate)
        if (isValid(newDate)) {
          // Set the current date to the event's date
          setCurrentViewDate(newDate)
          
          // Navigate to the event's date
          calendarRef.current.getInstance().setDate(newDate)
          
          // Make sure we're in day view (easier to see the specific event)
          if (window.innerWidth < 640) {
            changeView('day')
          }
        }
      }
      
      // If event exists, select it to view details
      if (event && showEventDialog === 'true') {
        // Short delay to ensure the calendar is fully rendered
        setTimeout(() => {
          setSelectedEvent(event)
          setIsViewDialogOpen(true)
          
          // Clear the sessionStorage values
          sessionStorage.removeItem('focusEventId')
          sessionStorage.removeItem('calendarDate')
          sessionStorage.removeItem('showEventDialog')
        }, 300)
      }
    }
  }, [events, calendarRef, changeView])

  // Calendar configuration options
  const calendarOptions: Options = {
    defaultView: window.innerWidth < 640 ? 'day' as ViewType : 'week' as ViewType,
    usageStatistics: false,
    useDetailPopup: false,
    useFormPopup: false,
    isReadOnly: false,
    week: {
      startDayOfWeek: 0,
      dayNames: isMobile ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workweek: false,
      showNowIndicator: true,
      hourStart: 0, // Show full 24 hours
      hourEnd: 24, // Show full 24 hours
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
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0))  // Increased from 1.8 to 2.0 max
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

  // Component-specific styles for better mobile experience
  const mobileCalendarStyles = `
    /* Reduce the height of time slots in day view */
    .toastui-calendar-timegrid-time-column {
      line-height: 0.8 !important;
    }
    
    /* Make grid cells shorter */
    .toastui-calendar-timegrid-gridline-half {
      height: ${screenSizeClass === 'xs' ? '24px' : screenSizeClass === 'sm' ? '26px' : '30px'} !important;
    }
    
    /* Adjust time slots and grid container to be more compact */
    .toastui-calendar-timegrid-container {
      height: auto !important;
    }
    
    /* Fix hour segment display */
    .toastui-calendar-timegrid-hour-segments {
      height: ${screenSizeClass === 'xs' ? '48px' : screenSizeClass === 'sm' ? '52px' : '60px'} !important;
    }
    
    /* Adjust grid cells behavior */
    .toastui-calendar-timegrid-grid-cell {
      height: ${screenSizeClass === 'xs' ? '48px' : screenSizeClass === 'sm' ? '52px' : '60px'} !important;
    }
    
    /* Fix the current time indicator positioning */
    .toastui-calendar-timegrid-now-indicator {
      z-index: 1 !important;
    }
    
    /* Ensure consistent row heights and spacing */
    .toastui-calendar-day-view .toastui-calendar-column {
      min-height: ${screenSizeClass === 'xs' ? '720px' : screenSizeClass === 'sm' ? '780px' : '900px'} !important;
    }
    
    /* Ensure grid stretches to fill column */
    .toastui-calendar-day-view .toastui-calendar-column .toastui-calendar-gridlines {
      min-height: ${screenSizeClass === 'xs' ? '720px' : screenSizeClass === 'sm' ? '780px' : '900px'} !important;
    }
    
    /* Make sure events scale properly with smaller grid */
    .toastui-calendar-time-event {
      min-height: ${screenSizeClass === 'xs' ? '20px' : '24px'} !important;
    }
    
    /* Adjust all-day area height */
    .toastui-calendar-panel-allday {
      height: auto !important;
      max-height: 40px !important;
    }
    
    /* Adjust time labels to fit in smaller grid */
    .toastui-calendar-timegrid-time-column .toastui-calendar-timegrid-time-label {
      height: ${screenSizeClass === 'xs' ? '48px' : screenSizeClass === 'sm' ? '52px' : '60px'} !important;
      line-height: ${screenSizeClass === 'xs' ? '48px' : screenSizeClass === 'sm' ? '52px' : '60px'} !important;
    }
    
    /* Direct fix for the 72px left on columns - set to 35px in mobile view */
    .toastui-calendar-columns {
      left: ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'} !important;
      width: calc(100% - ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'}) !important;
      margin-left: 0 !important;
    }
    
    /* Reset all previous margin/transform adjustments */
    .toastui-calendar-wrapper,
    .toastui-calendar-day-view,
    .toastui-calendar-layout.toastui-calendar-day-view-layout,
    .toastui-calendar-day-view .toastui-calendar-timegrid,
    .toastui-calendar-day-view .toastui-calendar-day-names,
    .toastui-calendar-day-view .toastui-calendar-panel-resizer,
    .toastui-calendar-day-view .toastui-calendar-time-event-container {
      transform: none !important;
      margin-left: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
    }
    
    /* Adjust time column width based on screen size */
    .toastui-calendar-timegrid-time-column {
      width: ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'} !important;
      font-size: ${screenSizeClass === 'xs' ? '10px' : screenSizeClass === 'sm' ? '11px' : '12px'} !important;
      padding-right: 0 !important;
      text-align: center !important;
      min-width: ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'} !important;
      border-right: none !important;
    }
    
    /* Position event containers correctly */
    .toastui-calendar-day-view .toastui-calendar-time-event-container {
      margin-left: ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'} !important;
      left: 0 !important;
    }

    /* Remove any borders/spacing for seamless display */
    .toastui-calendar-day-view .toastui-calendar-timegrid {
      border: none !important;
    }
    
    .toastui-calendar-day-view .toastui-calendar-timegrid-left {
      margin-right: 0 !important;
      padding-right: 0 !important;
      border-right: none !important;
    }
    
    /* Ensure grid content aligns with time column */
    .toastui-calendar-timegrid-gridline {
      margin-left: 0 !important;
      left: ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'} !important;
    }
    
    /* Position time indicators correctly */
    .toastui-calendar-timegrid-now-indicator-left {
      left: 0 !important;
      width: ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'} !important;
    }
    
    .toastui-calendar-timegrid-now-indicator-marker {
      left: ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'} !important;
    }
    
    .toastui-calendar-timegrid-now-indicator-today {
      left: ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'} !important;
      width: calc(100% - ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'}) !important;
    }
    
    /* Format events correctly */
    .toastui-calendar-time-event {
      padding: 2px 4px !important;
    }
    
    /* Ensure time grid right section takes up proper width */
    .toastui-calendar-timegrid-right {
      width: calc(100% - ${screenSizeClass === 'xs' ? '35px' : screenSizeClass === 'sm' ? '38px' : '42px'}) !important;
    }
  `;

  return (
    <div className="flex flex-col w-full h-full rounded-lg overflow-hidden">
      {/* Add custom styles for mobile and tablet views */}
      {(screenSizeClass === 'xs' || screenSizeClass === 'sm' || screenSizeClass === 'md') && (
        <style dangerouslySetInnerHTML={{ __html: mobileCalendarStyles }} />
      )}
      
      {/* Header */}
      <div className="flex-none px-2 py-1 border-b">
        <div className="flex flex-wrap items-center justify-between gap-1">
          {/* Date Display */}
          <div className="text-base font-medium mr-1">
            {getFormattedViewDate()}
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-0.5">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={navigatePrevious}
              className="p-0.5 h-6 w-6 min-w-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={navigateToday}
              className="text-xs px-1 py-0.5 h-6 min-h-0 min-w-0"
            >
              Today
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={navigateNext}
              className="p-0.5 h-6 w-6 min-w-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          
          {/* View Controls */}
          <div className="flex overflow-hidden rounded-md">
            <Button 
              size="sm" 
              variant={currentView === 'day' ? 'default' : 'outline'} 
              onClick={() => changeView('day')}
              className="rounded-none rounded-l-md px-1.5 h-6 min-h-0 text-xs"
            >
              Day
            </Button>
            <Button 
              size="sm" 
              variant={currentView === 'week' ? 'default' : 'outline'} 
              onClick={() => changeView('week')}
              className="rounded-none border-l-0 border-r-0 px-1.5 h-6 min-h-0 text-xs"
            >
              Week
            </Button>
            <Button 
              size="sm" 
              variant={currentView === 'month' ? 'default' : 'outline'} 
              onClick={() => changeView('month')}
              className="rounded-none rounded-r-md px-1.5 h-6 min-h-0 text-xs"
            >
              Month
            </Button>
          </div>
        
          {/* Mobile Zoom Controls (inline with other controls) */}
          {isMobile && (
            <div className="flex gap-0.5">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleZoomOut}
                className="px-1 h-6 w-6 min-h-0 min-w-0"
              >
                <span className="text-base">-</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleZoomIn}
                className="px-1 h-6 w-6 min-h-0 min-w-0"
              >
                <span className="text-base">+</span>
              </Button>
            </div>
          )}
        
          {/* Resource/Event Controls */}
          <div className="flex gap-0.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCalendarManagement(true)}
              className="text-xs h-6 min-h-0 px-1.5"
            >
              <CalendarIcon className="w-3 h-3 mr-0.5" />
              Calendars
            </Button>
            <Button
              size="sm"
              onClick={createNewEvent}
              className="text-xs h-6 min-h-0 px-1.5"
            >
              <Plus className="w-3 h-3 mr-0.5" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Container - Adjusted to account for smaller header */}
      <div 
        className="flex-1 min-h-0 w-full p-0 overflow-hidden relative flex flex-col" 
        style={{ 
          height: isMobile && currentView === 'day' 
            ? 'calc(100vh - 150px)' // More space for day view on mobile with no title and smaller header
            : 'calc(100vh - 85px)', // More space with smaller header
          minHeight: isMobile && currentView === 'day' ? '700px' : '600px',
        }}
      >
        <div 
          className={`flex-1 w-full h-full ${isMobile && currentView === 'day' ? 'pt-2 px-1' : ''}`}
          style={{ 
            transform: `scale(${zoomLevel})`, 
            transformOrigin: 'top left',
            width: isMobile ? `${Math.max(130, 110 + (zoomLevel * 30)) / zoomLevel}%` : '100%',  // Dynamic width based on zoom
            height: isMobile && currentView === 'day' ? `${Math.max(140, 120 + (zoomLevel * 30)) / zoomLevel}%` : '100%', // Dynamic height based on zoom
            // Adjusted to ensure no content is cut off from left
            marginLeft: screenSizeClass === 'xs' 
              ? '0px' 
              : screenSizeClass === 'sm' 
                ? '0px' 
                : screenSizeClass === 'md' 
                  ? '0px' 
                  : '0',
            paddingLeft: screenSizeClass === 'xs' ? '4px' : screenSizeClass === 'sm' ? '3px' : '0',
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
