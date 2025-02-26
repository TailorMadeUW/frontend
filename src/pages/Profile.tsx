import React from 'react'
import PageHeader from '../components/PageHeader'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'

const Profile: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-gray-50">
      <PageHeader title="My Profile" />
      <div className="flex-1 min-h-0 p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/avatars/user.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">John Doe</h2>
              <p className="text-gray-600">john.doe@example.com</p>
            </div>
          </div>
          <p className="text-gray-600">Profile settings and management coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default Profile 