import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SideBar from './components/SideBar'
import Toast from './components/ui/Toast'
import ChatWidget from './components/ChatWidget'
import Calendar from './pages/Calendar'
import Home from './pages/Home'
import Settings from './pages/Settings'
import Appointment from './pages/Appointment'
import Clients from './pages/Clients'
import Promotions from './pages/Promotions'
import Payment from './pages/Payment'
import Alerts from './pages/Alerts'
import Chats from './pages/Chats'
import Profile from './pages/Profile'
import LoadingScreen from './components/LoadingScreen'
import useLoadingStore from './stores/loadingStore'
import useCalendarStore from './stores/calendarStore'
import useCalendarServerStore from './stores/calendarServerStore'
import useProjectServerStore from './stores/projectServerStore'

const App: React.FC = () => {
  const { isLoading, initializeApp, resourceLoaded, setLoading } = useLoadingStore()
  const { initializeDefaultCalendars } = useCalendarStore()
  const { initializeDefaultCalendars: initializeServerCalendars, fetchEvents } = useCalendarServerStore()
  const { fetchProjects } = useProjectServerStore()


  useEffect(() => {
    // Initialize the app and load essential resources
    const startApp = async () => {
      // First, initialize core app data
      await initializeApp()
      await initializeDefaultCalendars()
      await initializeServerCalendars()
      await fetchProjects()
      await fetchEvents() // Fetch calendar events from server on app init
      
      // Mark resources as loaded as they become available
      // In a real app, you'd do this after each resource loads successfully
      setTimeout(() => resourceLoaded('calendar'), 500)
      setTimeout(() => resourceLoaded('profile'), 800)
      setTimeout(() => resourceLoaded('settings'), 1200)
      
      // Safety timeout - force loading to complete after max 4 seconds
      const safetyTimer = setTimeout(() => {
        setLoading(false)
      }, 4000)
      
      return () => clearTimeout(safetyTimer)
    }

    startApp()
  }, [initializeApp, resourceLoaded, setLoading])

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <Router>
        <div className="flex h-screen bg-gray-50">
          <SideBar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/app/home" replace />} />
              <Route path="/app/home" element={<Home />} />
              <Route path="/app/calendar" element={<Calendar />} />
              <Route path="/app/appointment" element={<Appointment />} />
              <Route path="/app/clients" element={<Clients />} />
              <Route path="/app/promotions" element={<Promotions />} />
              <Route path="/app/payment" element={<Payment />} />
              <Route path="/app/settings" element={<Settings />} />
              <Route path="/app/alerts" element={<Alerts />} />
              <Route path="/app/chats" element={<Chats />} />
              <Route path="/app/profile" element={<Profile />} />
            </Routes>
          </main>
          <Toast />
          <ChatWidget />
        </div>
      </Router>
    </>
  )
}

export default App
