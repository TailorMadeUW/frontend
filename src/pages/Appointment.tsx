import React from 'react'
import PageHeader from '../components/PageHeader'

const Appointment: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Appointments" />
      <div className="p-6 flex-1">
        <h2 className="text-xl font-semibold mb-4">Appointment Management</h2>
        <p className="text-gray-600">This page is under construction. You will be able to manage appointments here soon.</p>
      </div>
    </div>
  )
}

export default Appointment 