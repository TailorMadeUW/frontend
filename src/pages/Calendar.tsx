import React, { useEffect } from 'react'
import CalendarView from '../components/Calendar/CalendarView'
import PageLayout from '../components/PageLayout'
import useCalendarServerStore from '../stores/calendarServerStore'

const Calendar: React.FC = () => {
  const { fetchEvents } = useCalendarServerStore()

  useEffect(() => {
    // Fetch calendar events from the server when the component mounts
    fetchEvents()
  }, [fetchEvents])
  
  return (
    <PageLayout title="My Calendar">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-6 h-full">
        {/* Main Calendar Section */}
        <div className="lg:col-span-12 min-h-[500px] lg:min-h-0 rounded-none sm:rounded-lg">
          <div className="h-full bg-white shadow-none sm:shadow-sm border-0 sm:border overflow-hidden">
            <CalendarView />
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default Calendar 