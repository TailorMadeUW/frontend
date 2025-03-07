import React from 'react'
import PageLayout from '../components/PageLayout'

const Payment: React.FC = () => {
  return (
    <PageLayout title="Payments">
      <div className="flex-1 min-h-0 p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <p className="text-gray-600">Payment processing and history coming soon...</p>
        </div>
      </div>
    </PageLayout>
  )
}

export default Payment 