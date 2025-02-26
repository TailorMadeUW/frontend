import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Calendar, Event } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface CalendarState {
  calendars: Calendar[]
  events: Event[]
  addCalendar: (calendar: Omit<Calendar, 'id'>) => void
  updateCalendar: (id: string, updates: Partial<Calendar>) => void
  deleteCalendar: (id: string) => void
  addEvent: (event: Omit<Event, 'id'>) => void
  updateEvent: (id: string, updates: Partial<Omit<Event, 'id'>>) => void
  deleteEvent: (id: string) => void
  initializeDefaultCalendars: () => void
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

const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      calendars: [],
      events: [],
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
      addEvent: (event) => 
        set((state) => ({
          events: [...state.events, { ...event, id: uuidv4() }]
        })),
      updateEvent: (id, updates) => 
        set((state) => ({
          events: state.events.map(event => 
            event.id === id ? { ...event, ...updates } : event
          )
        })),
      deleteEvent: (id) => 
        set((state) => ({
          events: state.events.filter(event => event.id !== id)
        })),
      initializeDefaultCalendars: () => {
        const { calendars, addCalendar } = get();
        
        // Only add default calendars if none exist
        if (calendars.length === 0) {
          defaultCalendars.forEach(calendar => {
            addCalendar(calendar);
          });
        }
      }
    }),
    {
      name: 'calendar-storage',
      version: 1
    }
  )
)

export default useCalendarStore
