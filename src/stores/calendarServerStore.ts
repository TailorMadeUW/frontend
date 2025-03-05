import { create } from 'zustand'
import { Calendar, Event } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { calendarApi } from '../lib/api'

interface CalendarState {
  calendars: Calendar[]
  events: Event[]
  isLoading: boolean
  addCalendar: (calendar: Omit<Calendar, 'id'>) => void
  updateCalendar: (id: string, updates: Partial<Calendar>) => void
  deleteCalendar: (id: string) => void
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>
  updateEvent: (id: string, updates: Partial<Omit<Event, 'id'>>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  initializeDefaultCalendars: () => Promise<void>
  fetchEvents: () => Promise<void>
}

// Default calendars to initialize the store with
const defaultCalendars: Omit<Calendar, 'id'>[] = [
  {
    name: 'Work',
    emoji: '💼',
    color: '#4285F4',
    backgroundColor: '#4285F420',
    dragBackgroundColor: '#4285F420',
    borderColor: '#4285F4',
    description: 'Work-related appointments and meetings',
    isAvailable: true,
  },
  {
    name: 'Personal',
    emoji: '🏠',
    color: '#0F9D58',
    backgroundColor: '#0F9D5820',
    dragBackgroundColor: '#0F9D5820',
    borderColor: '#0F9D58',
    description: 'Personal appointments and events',
    isAvailable: true,
  },
  {
    name: 'Holidays',
    emoji: '🎉',
    color: '#DB4437',
    backgroundColor: '#DB443720',
    dragBackgroundColor: '#DB443720',
    borderColor: '#DB4437',
    description: 'Holidays and celebrations',
    isAvailable: true,
  }
];

const useCalendarServerStore = create<CalendarState>()(
    (set, get) => ({
      calendars: [],
      events: [],
      isLoading: false,
      addCalendar: (calendar) => 
        set((state) => ({
          calendars: [...state.calendars, { 
            ...calendar, 
            id: uuidv4(),
            backgroundColor: calendar.color + '20',
            dragBackgroundColor: calendar.color + '20',
            borderColor: calendar.color
          }]
        })),
      updateCalendar: (id, updates) => 
        set((state) => ({
          calendars: state.calendars.map(cal => 
            cal.id === id ? { 
              ...cal, 
              ...updates,
              backgroundColor: updates.color ? updates.color + '20' : cal.backgroundColor,
              dragBackgroundColor: updates.color ? updates.color + '20' : cal.dragBackgroundColor,
              borderColor: updates.color || cal.borderColor
            } : cal
          )
        })),

      deleteCalendar: (id) => 
        set((state) => ({
          calendars: state.calendars.filter(cal => cal.id !== id),
          events: state.events.filter(event => event.calendarId !== id)
        })),

      addEvent: async (event) => {
        try {
          const response = await calendarApi.addAppointment({
            ...event,
            date: event.start,
            clientName: event.title
          });

          if (response.success) {
            // Refresh the events list instead of manually updating state
            await get().fetchEvents();
          }
        } catch (error) {
          console.error('Failed to add event:', error);
        }
      },
  
      updateEvent: async (id, updates) => {
        try {
          const response = await calendarApi.updateAppointment(id, {
            ...updates,
            date: updates.start,
            clientName: updates.title
          });

          if (response.success) {
            await get().fetchEvents();
          }
        } catch (error) {
          console.error('Failed to update event:', error);
        }
      },

      deleteEvent: async (id) => {
        try {
          const response = await calendarApi.deleteAppointment(id);
          
          if (response.success) {
            await get().fetchEvents();
          }
        } catch (error) {
          console.error('Failed to delete event:', error);
        }
      },

      fetchEvents: async () => {
        set({ isLoading: true });
        try {
          const response = await calendarApi.getAppointments();
          
          if (response.success && response.data) {
            const formattedEvents = response.data.map((appointment: any) => ({
              ...appointment,
              title: appointment.clientName,
              start: appointment.date,
            }));

            set({ events: formattedEvents });
          }
        } catch (error) {
          console.error('Failed to fetch events:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      initializeDefaultCalendars: async () => {
        const { calendars, addCalendar } = get();
        
        if (calendars.length === 0) {
          defaultCalendars.forEach(calendar => {
            addCalendar(calendar);
          });
        }

        await get().fetchEvents();
      }
    })
)

export default useCalendarServerStore
