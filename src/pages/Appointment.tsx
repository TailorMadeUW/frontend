import React from 'react'
import PageHeader from '../components/PageHeader'

const Appointment: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Appointments" />
      <div className="p-4 sm:p-6 flex-1">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Appointment Management</h2>
        <p className="text-gray-600">This page is under construction. You will be able to manage appointments here soon.</p>
      </div>
    </div>
  )
}

export default Appointment 