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
  date: Date
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
  High = 'High'
}


export const ActionStateShim = {
  0: 'Todo',
  1: 'InProgress',
  2: 'Done'
};

export const ActionPriorityShim = {
  0: 'Low',
  1: 'Medium',
  2: 'High'
};

export interface Action {
  id: string
  name: string
  description: string
  priority: ActionPriority
  type: ActionType,
  date: Date,
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
  progress: number
  actions: Action[]
  appointments: Event[]
}
