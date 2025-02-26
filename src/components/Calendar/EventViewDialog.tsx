import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { format, differenceInHours, isValid } from 'date-fns'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Users,
  X,
  FileText,
  Tag,
  Edit,
  Trash2
} from 'lucide-react'
import { Event } from '../../types'

interface EventViewDialogProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  event: Event
}

const EventViewDialog: React.FC<EventViewDialogProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  event
}) => {
  // Ensure start and end dates are valid Date objects
  const startDate = event.start instanceof Date ? event.start : new Date(event.start)
  const endDate = event.end instanceof Date ? event.end : new Date(event.end)

  // Format dates safely
  const formatDateSafely = (date: Date | string | undefined, formatStr: string): string => {
    if (!date) return 'Not set'
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      if (!isValid(dateObj)) return 'Invalid date'
      return format(dateObj, formatStr)
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  // Calculate duration safely
  const getDuration = (start: Date | undefined, end: Date | undefined): string | null => {
    if (!start || !end) return null
    
    try {
      const startDate = start instanceof Date ? start : new Date(start)
      const endDate = end instanceof Date ? end : new Date(end)
      
      if (!isValid(startDate) || !isValid(endDate)) return null
      
      const hours = differenceInHours(endDate, startDate)
      if (hours < 1) return 'Less than an hour'
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    } catch (error) {
      console.error('Error calculating duration:', error)
      return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0" hideCloseButton={true}>
        <DialogHeader className="px-6 py-4 pb-2 border-b">
          <DialogTitle className="text-2xl text-gray-700 font-medium flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>{event.title}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={onEdit} className="hover:bg-gray-100 rounded-full">
                <Edit className="h-4 w-4 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="hover:bg-gray-100 rounded-full">
                <Trash2 className="h-4 w-4 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded-full">
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-500 mt-1">
            View event details
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CalendarIcon className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="text-gray-500 text-sm">Date</div>
                  <div className="mt-1 text-gray-900">
                    {formatDateSafely(startDate, 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="text-gray-500 text-sm">Time</div>
                  <div className="mt-1 text-gray-900">
                    {formatDateSafely(startDate, 'h:mm a')} - {formatDateSafely(endDate, 'h:mm a')}
                  </div>
                  {getDuration(startDate, endDate) && (
                    <div className="text-gray-500 text-sm mt-1">
                      Duration: {getDuration(startDate, endDate)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Tag className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="text-gray-500 text-sm">Calendar</div>
                  <div className="mt-1 text-gray-900">
                    {event.calendarId}
                  </div>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-gray-500 text-sm">Location</div>
                    <div className="mt-1 text-gray-900">
                      {event.location}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {event.employee && (
                <div className="flex items-start gap-4">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-gray-500 text-sm">Employee</div>
                    <div className="mt-1 text-gray-900">
                      {event.employee}
                    </div>
                  </div>
                </div>
              )}

              {event.client && (
                <div className="flex items-start gap-4">
                  <Users className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-gray-500 text-sm">Client</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={event.client.avatar || '/placeholder-avatar.jpg'} alt={event.client.name} />
                        <AvatarFallback>{event.client.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900">{event.client.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="flex items-start gap-4">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-gray-500 text-sm">Description</div>
                    <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {event.description}
                    </div>
                  </div>
                </div>
              )}

              {event.notes && (
                <div className="flex items-start gap-4">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-gray-500 text-sm">Notes</div>
                    <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {event.notes}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EventViewDialog 