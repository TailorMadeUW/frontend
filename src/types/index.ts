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

export enum ActionType {
  SendConfirmationEmail = 'SendConfirmationEmail',
  SendEmailToContractor = 'SendEmailToContractor',
  OrderInventory = 'OrderInventory',
  SendAdEmail = 'SendAdEmail'
}

export enum ActionState {
  Todo = 'Todo',
  InProgress = 'InProgress',
  Done = 'Done'
}

export enum ActionPriority {
  Low = 'Low',
  Medium = 'Medium',
  HIgh = 'High'
}

export interface Action {
  id: string
  name: string
  priority: ActionPriority
  type: ActionType,
  state: ActionState
  confirmed: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  clientName: string
  clientEmail: string,
  clientCost: number
  inventoryNeeded: number
  appointmentsNeeded: number
  measurements: string
  notes: string
  dueDate: Date
  actions: Action[]
  appointments: Event[]
}
