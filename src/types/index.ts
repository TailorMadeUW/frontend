import type { EventObject } from '@toast-ui/calendar'

export interface Calendar {
  id: string
  name: string
  emoji: string
  color: string
  backgroundColor: string
  dragBackgroundColor: string
  borderColor: string
  description?: string
  isAvailable: boolean
}

export interface Event {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  calendarId: string
  state: 'busy' | 'free'
  location?: string
  employee?: string
  client?: {
    name: string
    avatar?: string
  }
  notes?: string
}

export interface AvailabilitySlot {
  start: Date
  end: Date
  isAvailable: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  clientName: string
  clientCost: number
  dueDate: Date
}
