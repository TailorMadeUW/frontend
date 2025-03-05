import React, { useState } from 'react'
import { getWeekDays } from '../../lib/utils'
import { Event } from '../../types'
import EventDialog from './EventDialog'
import { differenceInDays } from 'date-fns'
import useCalendarStore from '../../stores/calendarServerStore'

interface CalendarGridProps {
  currentDate: Date
  events: Event[]
}

interface ProcessedEvent extends Event {
  startPosition: number
  span: number
  row: number
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, events }) => {
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>()
  const { calendars } = useCalendarStore()
  const weekDays = getWeekDays()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startingDayIndex = firstDayOfMonth.getDay()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - startingDayIndex + 1
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null
  })

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
    setSelectedEvent(undefined)
    setIsEventDialogOpen(true)
  }

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setSelectedDate(new Date(event.start))
    setIsEventDialogOpen(true)
  }

  const processEvents = (events: Event[]): ProcessedEvent[] => {
    const processedEvents = events.map(event => {
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const effectiveStart = startDate < monthStart ? monthStart : startDate
      const effectiveEnd = endDate > monthEnd ? monthEnd : endDate

      const startPosition = effectiveStart.getDate() + startingDayIndex - 1
      const span = differenceInDays(effectiveEnd, effectiveStart) + 1

      return {
        ...event,
        startPosition,
        span,
        row: 0 // Will be assigned later
      }
    }).sort((a, b) => {
      const spanDiff = b.span - a.span
      if (spanDiff !== 0) return spanDiff
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })

    // Assign rows to events
    const assignedPositions = new Set<string>()
    processedEvents.forEach(event => {
      let row = 0
      let positionTaken = true
      while (positionTaken) {
        positionTaken = false
        for (let i = 0; i < event.span; i++) {
          const position = `${event.startPosition + i}-${row}`
          if (assignedPositions.has(position)) {
            positionTaken = true
            row++
            break
          }
        }
        if (!positionTaken) {
          event.row = row
          for (let i = 0; i < event.span; i++) {
            assignedPositions.add(`${event.startPosition + i}-${row}`)
          }
        }
      }
    })

    return processedEvents
  }

  const renderWeek = (weekStartIndex: number) => {
    const weekEvents = processEvents(events).filter(event => {
      const eventStartPos = event.startPosition
      const eventEndPos = eventStartPos + event.span - 1
      return (
        (eventStartPos >= weekStartIndex && eventStartPos < weekStartIndex + 7) ||
        (eventEndPos >= weekStartIndex && eventEndPos < weekStartIndex + 7) ||
        (eventStartPos <= weekStartIndex && eventEndPos >= weekStartIndex + 6)
      )
    })

    const maxRow = Math.max(...weekEvents.map(event => event.row), 0)

    return (
      <div className="relative">
        {/* Events layer */}
        <div 
          className="absolute top-0 left-0 right-0 w-full"
          style={{ height: `${(maxRow + 1) * 24}px` }}
        >
          {weekEvents.map(event => {
            const calendar = calendars.find(cal => cal.id === event.calendarId)
            const startOffset = ((event.startPosition - weekStartIndex) * (100 / 7))
            const width = (event.span * (100 / 7))
            
            // Only render if event starts in this week or is the first week it appears in
            if (event.startPosition >= weekStartIndex && event.startPosition < weekStartIndex + 7 ||
                (event.startPosition < weekStartIndex && weekStartIndex === Math.floor(event.startPosition / 7) * 7)) {
              
              return (
                <div
                  key={event.id}
                  className="absolute h-5 cursor-pointer rounded-sm px-1 truncate"
                  style={{
                    left: `${startOffset}%`,
                    width: `${width}%`,
                    top: `${event.row * 24}px`,
                    backgroundColor: `${calendar?.color}20`,
                    color: calendar?.color,
                    fontSize: '0.7rem'
                  }}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  {event.title}
                </div>
              )
            }
            return null
          })}
        </div>

        {/* Calendar grid */}
        <div 
          className="grid grid-cols-7 gap-px"
          style={{ 
            marginTop: `${(maxRow + 1) * 24}px`,
            minHeight: '80px'
          }}
        >
          {Array(7).fill(0).map((_, i) => {
            const dayIndex = weekStartIndex + i
            const day = days[dayIndex]
            
            return (
              <div
                key={i}
                className={`relative p-1 ${
                  day ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                }`}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <span className="text-xs text-gray-500">{day}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg bg-white shadow text-sm">
        <div className="grid grid-cols-7 gap-px border-b">
          {weekDays.map((day) => (
            <div key={day} className="py-1 px-2 text-center text-xs font-medium text-gray-500">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>
        {Array(6).fill(0).map((_, weekIndex) => (
          <div key={weekIndex}>
            {renderWeek(weekIndex * 7)}
          </div>
        ))}
      </div>
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        selectedDate={selectedDate}
        selectedEvent={selectedEvent}
      />
    </>
  )
}

export default CalendarGrid
