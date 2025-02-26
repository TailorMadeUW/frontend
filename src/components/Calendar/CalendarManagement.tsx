import React from 'react'
import { Plus, MoreVertical, Eye, EyeOff, Trash2, X } from 'lucide-react'
import { Button } from '../ui/button'
import useCalendarStore from '../../stores/calendarStore'
import { Calendar } from '../../types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { CreateCalendarDialog } from './CreateCalendarDialog'
import { cn } from '../../lib/utils'

interface CalendarManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarManagement: React.FC<CalendarManagementProps> = ({ isOpen, onClose }) => {
  const { calendars, updateCalendar, deleteCalendar } = useCalendarStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

  const handleVisibilityToggle = (calendar: Calendar) => {
    updateCalendar(calendar.id, { isAvailable: !calendar.isAvailable })
  }

  const handleDeleteCalendar = (id: string) => {
    if (confirm('Are you sure you want to delete this calendar?')) {
      deleteCalendar(id)
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/20 z-50 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">My Calendars</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Calendar
          </Button>

          <div className="space-y-1">
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span className="text-sm">{calendar.emoji}</span>
                  <span className="text-sm">{calendar.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleVisibilityToggle(calendar)}
                  >
                    {calendar.isAvailable ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCalendar(calendar.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>

        <CreateCalendarDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </>
  )
}
