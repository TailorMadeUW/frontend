import React from 'react'
import CalendarView from '../components/Calendar/CalendarView'
import PageHeader from '../components/PageHeader'

const Calendar: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-gray-50">
      <PageHeader title="My Calendar" />
      <div className="flex-1 min-h-0 px-0 sm:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Main Calendar Section */}
          <div className="lg:col-span-12 min-h-[600px] lg:min-h-0">
            <div className="h-full bg-white rounded-lg shadow-sm border">
              <CalendarView />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar 