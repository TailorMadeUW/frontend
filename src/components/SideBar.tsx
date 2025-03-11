import React, { useState } from 'react'
import { Calendar, Clock, Settings, User, Terminal, Menu, X, CreditCard, MessageSquare, Bell, Users, Percent, Home as HomeIcon, FolderKanban } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import useCalendarStore from '../stores/calendarServerStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import useNotificationStore from '../stores/notificationStore'
import useAlertStore from '../stores/alertStore'
import { cn } from '../lib/utils'
import TailorMadeLogo from './assets/img/TailorMade-Logo.svg'

const SideBar: React.FC = () => {
  const { calendars } = useCalendarStore()
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { showNotification } = useNotificationStore()
  const { unreadCount, toggleOpen } = useAlertStore()
  const location = useLocation()

  const menuItems = [
    { icon: HomeIcon, label: 'Home', path: '/app/home' },
    { icon: Calendar, label: 'Calendar', path: '/app/calendar' },
    { icon: Clock, label: 'Appointment', path: '/app/appointment' },
    { icon: Users, label: 'Clients', path: '/app/clients' },
    { icon: Percent, label: 'Promotions', path: '/app/promotions' },
    { icon: CreditCard, label: 'Payment', path: '/app/payment' },
    { icon: FolderKanban, label: 'Projects', path: '/app/projects' },
  ]

  // Items that will be in the header on desktop and in mobile menu
  const headerItems = [
    { icon: Settings, label: 'Settings', path: '/app/settings' },
    { 
      icon: Bell, 
      label: 'Alerts', 
      path: '/app/alerts', 
      badge: unreadCount > 0 ? unreadCount : undefined,
      onClick: (e: React.MouseEvent) => {
        // On desktop (in mobile menu), navigate to the alerts page
        // This is only needed for mobile; desktop uses the popup
        if (window.innerWidth < 1024) {
          setIsMobileMenuOpen(false);
        } else {
          e.preventDefault();
          toggleOpen();
        }
      }
    },
    { icon: MessageSquare, label: 'Chats', path: '/app/chats', badge: 5 },
    { icon: User, label: 'Profile', path: '/app/profile' },
  ]

  // Extract just the items we want to show in the title bar on mobile
  const mobileHeaderItems = headerItems.filter(item => 
    item.label === 'Alerts' || item.label === 'Chats' || item.label === 'Profile'
  );

  const testScenarios = [
    {
      name: 'Test Error Notification',
      action: () => showNotification('This is a test error message', 'error')
    },
    {
      name: 'Test Success Notification',
      action: () => showNotification('This is a test success message', 'success')
    }
  ]

  const SidebarContent = ({ includeHeaderItems = false }) => {
    // Add isMobile check to detect if we're in a mobile context
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    
    return (
    <>
      <div className={`px-4 ${isMobile ? 'mb-4' : 'mb-4'} flex items-center gap-2`}>
        <Link to="/app/home" className="flex items-center gap-2">
          <img src={TailorMadeLogo} alt="TailorMade Logo" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
          <span className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-blue-600`}>TailorMade</span>
        </Link>
      </div>

      <div className={`${isMobile ? 'px-3 mt-3 mb-2' : 'px-4 mt-4'} flex gap-2`}>
        {calendars.map(calendar => (
          <div 
            key={calendar.id} 
            className={`rounded-full ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} 
            style={{ backgroundColor: calendar.color }}
          />
        ))}
      </div>
      
      {menuItems.map((item) => (
        <Link 
          key={item.path}
          to={item.path}
          className={cn(
            'w-full flex items-center gap-3 cursor-pointer',
            isMobile ? 'px-3 py-1.5' : 'px-4 py-2',
            location.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <item.icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <span className={isMobile ? 'text-sm' : ''}>{item.label}</span>
        </Link>
      ))}
      
      {includeHeaderItems && (
        <>
          <div className={`${isMobile ? 'mt-4 mb-1 px-3' : 'mt-6 mb-2 px-4'} text-sm font-medium text-gray-500`}>
            Settings & Profile
          </div>
          {headerItems
            .filter(item => item.label === 'Settings' || item.label === 'Profile') // Show both Settings and Profile in the menu
            .map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  'w-full flex items-center gap-3 cursor-pointer relative',
                  isMobile ? 'px-3 py-1.5' : 'px-4 py-2',
                  location.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                )}
                onClick={(e) => {
                  if (item.onClick) {
                    item.onClick(e);
                  } else {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <item.icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                <span className={isMobile ? 'text-sm' : ''}>{item.label}</span>
                {item.badge && (
                  <span className={`absolute right-4 bg-red-500 text-white text-xs rounded-full px-1.5 min-w-5 ${isMobile ? 'h-4' : 'h-5'} flex items-center justify-center`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
        </>
      )}

      {/* <div 
        className={`mt-auto w-full flex items-center gap-3 cursor-pointer hover:bg-gray-100 
        ${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'}`}
        onDoubleClick={() => setShowAdminPanel(true)}
      >
        <Terminal className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <span className={isMobile ? 'text-sm' : ''}>Admin Testing (DELETE LATER)</span>
      </div> */}
    </>
  )
}

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-48 bg-white border-r shadow-md flex-col items-start py-6">
        <SidebarContent includeHeaderItems={false} />
      </div>

      {/* Mobile Navbar and Slide-out Panel */}
      <div className="lg:hidden">
        {/* Top Navbar */}
        <div className="fixed top-0 left-0 right-0 h-14 border-b shadow-sm flex items-center justify-between px-3 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/app/home" className="flex items-center gap-1.5">
              <img src={TailorMadeLogo} alt="TailorMade Logo" className="w-5 h-5" />
              <span className="text-base font-semibold text-blue-600">TailorMade</span>
            </Link>
          </div>
          
          {/* Mobile Header Items */}
          <div className="flex items-center gap-1">
            {mobileHeaderItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative p-1.5 text-gray-600 hover:text-blue-600 rounded-full transition-colors"
                onClick={(e) => {
                  if (item.onClick) {
                    item.onClick(e);
                  }
                }}
              >
                <item.icon className="w-4 h-4" />
                {item.badge && (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-3.5 h-3.5 bg-red-500 text-white text-[10px] rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Slide-out Panel */}
        <div
          className={cn(
            "fixed inset-0 z-30 transform transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute top-0 left-0 bottom-0 w-56 bg-white shadow-xl flex flex-col">
            <div className="p-3 flex justify-between items-center border-b">
              <span className="text-base font-semibold">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 py-4">
              <SidebarContent includeHeaderItems={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel Dialog */}
      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Testing Panel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {testScenarios.map((scenario, index) => (
              <Button
                key={index}
                onClick={() => {
                  scenario.action()
                  setShowAdminPanel(false)
                }}
                variant="outline"
                className="w-full"
              >
                {scenario.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SideBar
