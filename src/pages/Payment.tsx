import React from 'react'
import PageHeader from '../components/PageHeader'

const Payment: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-gray-50">
      <PageHeader title="Payments" />
      <div className="flex-1 min-h-0 p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-600">Payment processing and history coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default Payment 