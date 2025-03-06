import React from 'react'
import PageLayout from '../components/PageLayout'

const Profile: React.FC = () => {
  return (
    <PageLayout title="Profile">
      <div className="p-6 flex-1">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        <p className="text-gray-600">This page is under construction. You will be able to manage your profile here soon.</p>
      </div>
    </PageLayout>
  )
}

export default Profile 