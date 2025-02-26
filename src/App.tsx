import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SideBar from './components/SideBar'
import Toast from './components/ui/Toast'
import Calendar from './pages/Calendar'
import Schedule from './pages/Schedule'
import Contacts from './pages/Contacts'
import Settings from './pages/Settings'
import Appointment from './pages/Appointment'
import Clients from './pages/Clients'
import Promotions from './pages/Promotions'
import Payment from './pages/Payment'
import Alerts from './pages/Alerts'
import Chats from './pages/Chats'
import Profile from './pages/Profile'

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <SideBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/app/calendar" replace />} />
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
      </div>
    </Router>
  )
}

export default App
