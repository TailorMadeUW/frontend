import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, MessageSquare, Settings, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { cn } from '../lib/utils'
import AlertPopup from './AlertPopup'
import useAlertStore from '../stores/alertStore'

interface PageHeaderProps {
  title: string
}

const PageHeader: React.FC<PageHeaderProps> = ({ title }) => {
  const { unreadCount, toggleOpen, isOpen } = useAlertStore()
  
  const headerItems = [
    { icon: Settings, label: 'Settings', path: '/app/settings' },
    { icon: MessageSquare, label: 'Chats', path: '/app/chats', badge: 5 },
  ]

  return (
    <header className="flex-none flex justify-between items-center p-3 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
      
      {/* Header items - visible only on desktop */}
      <div className="hidden lg:flex items-center gap-4">
        {headerItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            <item.icon className="w-5 h-5" />
            {item.badge && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
        
        {/* Alert Bell with Popup */}
        <div className="relative">
          <button
            onClick={toggleOpen}
            className={cn(
              "relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors",
              isOpen && "text-blue-600 bg-blue-50"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <AlertPopup />
        </div>
        
        {/* Profile Avatar */}
        <Link to="/app/profile" className="flex items-center gap-2 ml-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/user.png" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}

export default PageHeader 