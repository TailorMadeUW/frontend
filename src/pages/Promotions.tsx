import React from 'react'
import PageHeader from '../components/PageHeader'

const Promotions: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-gray-50">
      <PageHeader title="Promotions" />
      <div className="flex-1 min-h-0 p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <p className="text-gray-600">Promotions and discounts coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default Promotions 