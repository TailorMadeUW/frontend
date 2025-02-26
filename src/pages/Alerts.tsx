import React, { useState } from 'react'
import PageHeader from '../components/PageHeader'
import useAlertStore, { Alert, AlertType } from '../stores/alertStore'
import { cn } from '../lib/utils'
import { CheckCircle2, XCircle, AlertCircle, Info, X, Bell, Trash2, Check, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

// Alert icon mapping (reusing similar code from AlertPopup)
const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />
    case 'error': return <XCircle className="w-5 h-5 text-red-500" />
    case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />
    case 'info': default: return <Info className="w-5 h-5 text-blue-500" />
  }
}

// Background color mapping for alerts (reusing similar code from AlertPopup)
const getAlertBackground = (type: AlertType, read: boolean) => {
  if (read) return 'bg-white'
  
  switch (type) {
    case 'success': return 'bg-green-50'
    case 'error': return 'bg-red-50'
    case 'warning': return 'bg-amber-50'
    case 'info': default: return 'bg-blue-50'
  }
}

type FilterType = 'all' | AlertType

const Alerts: React.FC = () => {
  const { alerts, markAsRead, markAllAsRead, removeAlert, clearAllAlerts } = useAlertStore()
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')
  
  // Apply filters
  const filteredAlerts = alerts.filter(alert => 
    currentFilter === 'all' || alert.type === currentFilter
  )
  
  // Group alerts by date
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  
  const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
    const date = new Date(alert.timestamp).toDateString()
    
    let groupKey = date
    if (date === today) {
      groupKey = 'Today'
    } else if (date === yesterday) {
      groupKey = 'Yesterday'
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    
    groups[groupKey].push(alert)
    return groups
  }, {} as Record<string, Alert[]>)
  
  // Sort groups by date (today first, then yesterday, then others chronologically)
  const sortedGroupKeys = Object.keys(groupedAlerts).sort((a, b) => {
    if (a === 'Today') return -1
    if (b === 'Today') return 1
    if (a === 'Yesterday') return -1
    if (b === 'Yesterday') return 1
    return new Date(b).getTime() - new Date(a).getTime()
  })
  
  const filterOptions: { label: string; value: FilterType; count: number }[] = [
    { label: 'All', value: 'all', count: alerts.length },
    { label: 'Info', value: 'info', count: alerts.filter(a => a.type === 'info').length },
    { label: 'Success', value: 'success', count: alerts.filter(a => a.type === 'success').length },
    { label: 'Warning', value: 'warning', count: alerts.filter(a => a.type === 'warning').length },
    { label: 'Error', value: 'error', count: alerts.filter(a => a.type === 'error').length }
  ]

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-gray-50">
      <PageHeader title="Alerts & Notifications" />
      <div className="flex-1 min-h-0 p-6 flex flex-col">
        <div className="bg-white rounded-lg shadow-sm border flex flex-col flex-1 overflow-hidden">
          {/* Header with filters and actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border-b">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setCurrentFilter(option.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full flex items-center gap-1",
                    currentFilter === option.value
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {option.value !== 'all' && getAlertIcon(option.value as AlertType)}
                  {option.value === 'all' && <Filter className="w-4 h-4" />}
                  <span>{option.label}</span>
                  <span className="bg-gray-200 text-gray-700 rounded-full px-1.5 text-xs">
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                disabled={alerts.filter(a => !a.read).length === 0}
              >
                <Check className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
              
              <button
                onClick={clearAllAlerts}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                disabled={alerts.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            </div>
          </div>
          
          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredAlerts.length > 0 ? (
              <>
                {sortedGroupKeys.map(groupKey => (
                  <div key={groupKey} className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{groupKey}</h3>
                    
                    <div className="space-y-3">
                      {groupedAlerts[groupKey].map(alert => (
                        <div
                          key={alert.id}
                          className={cn(
                            "relative p-4 rounded-lg border",
                            getAlertBackground(alert.type, alert.read)
                          )}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getAlertIcon(alert.type)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <h4 className={cn(
                                  "font-medium",
                                  !alert.read && "font-semibold"
                                )}>
                                  {alert.title}
                                </h4>
                                <span className="text-xs text-gray-500 mt-1 sm:mt-0">
                                  {format(new Date(alert.timestamp), 'h:mm a')}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                              
                              <div className="flex justify-between items-center mt-3">
                                {alert.actionUrl && alert.actionLabel ? (
                                  <Link
                                    to={alert.actionUrl}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    {alert.actionLabel}
                                  </Link>
                                ) : (
                                  <span></span>
                                )}
                                
                                <div className="flex gap-2">
                                  {!alert.read && (
                                    <button
                                      onClick={() => markAsRead(alert.id)}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      Mark as read
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => removeAlert(alert.id)}
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                <Bell className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p>You don't have any {currentFilter !== 'all' ? currentFilter : ''} notifications yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alerts 