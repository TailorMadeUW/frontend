declare module '@toast-ui/react-calendar' {
  import { ComponentProps, ForwardedRef } from 'react'
  import type { Options, EventObject, ViewType } from '@toast-ui/calendar'

  interface Props extends Options {
    height: string | number
    events: EventObject[]
    onBeforeCreateEvent?: (event: EventObject) => boolean
    onBeforeUpdateEvent?: (event: EventObject) => boolean
    onBeforeDeleteEvent?: (event: EventObject) => boolean
    onClickEvent?: (event: EventObject) => void
    ref?: ForwardedRef<any>
  }

  export default function Calendar(props: Props): JSX.Element
}

declare module '@toast-ui/calendar' {
  export interface EventObject {
    id?: string
    calendarId: string
    title: string
    body?: string
    start: Date | { toDate: () => Date }
    end: Date | { toDate: () => Date }
    isAllday?: boolean
    category: 'time' | 'allday'
    dueDateClass?: string
    isVisible?: boolean
    isPending?: boolean
    isFocused?: boolean
    isReadOnly?: boolean
    isPrivate?: boolean
    location?: string
    attendees?: string[]
    recurrenceRule?: string
    state?: string
    color?: string
    backgroundColor?: string
    dragBackgroundColor?: string
    borderColor?: string
  }

  export interface Options {
    defaultView?: ViewType
    useCreationPopup?: boolean
    useDetailPopup?: boolean
    useFormPopup?: boolean
    isReadOnly?: boolean
    week?: WeekOptions
    month?: MonthOptions
    gridSelection?: boolean
    usageStatistics?: boolean
    timezone?: TimezoneOptions
    theme?: ThemeOptions
    template?: TemplateOptions
    calendars?: CalendarInfo[]
  }

  export type ViewType = 'month' | 'week' | 'day'

  export interface WeekOptions {
    startDayOfWeek?: number
    dayNames?: string[]
    workweek?: boolean
    showNowIndicator?: boolean
    hourStart?: number
    hourEnd?: number
    eventView?: boolean | string[]
    taskView?: boolean
    collapseDuplicateEvents?: boolean
  }

  export interface MonthOptions {
    dayNames?: string[]
    startDayOfWeek?: number
    workweek?: boolean
    narrowWeekend?: boolean
    visibleWeeksCount?: number
    isAlways6Weeks?: boolean
    visibleEventCount?: number
  }

  export interface CalendarInfo {
    id: string
    name: string
    color?: string
    backgroundColor?: string
    borderColor?: string
    dragBackgroundColor?: string
  }
} 