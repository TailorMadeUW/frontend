import React from 'react'
import { Dialog, DialogContent } from '../ui/dialog'
import { Calendar as CalendarIcon, Clock, MapPin, User, Users } from 'lucide-react'
import { Button } from '../ui/button'
import { format } from 'date-fns'

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  event: {
    title: string
    start: Date
    end: Date
    location?: string
    employee?: string
    client?: {
      name: string
      avatar?: string
    }
    notes?: string
  }
}

const EventDialog: React.FC<EventDialogProps> = ({ isOpen, onClose, event }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{event.title}</h2>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 text-gray-600">
            <CalendarIcon className="w-5 h-5" />
            <span>{format(event.start, 'EEE, MMMM d')}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Time */}
          <div className="flex items-center gap-3 text-gray-600">
            <Clock className="w-5 h-5" />
            <span>
              {format(event.start, 'hh:mm')} - {format(event.end, 'hh:mm a')}
            </span>
          </div>

          {/* Employee */}
          {event.employee && (
            <div className="flex items-center gap-3 text-gray-600">
              <User className="w-5 h-5" />
              <span>{event.employee}</span>
            </div>
          )}

          {/* Client */}
          {event.client && (
            <div className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5" />
              <div className="flex items-center gap-2">
                {event.client.avatar && (
                  <img
                    src={event.client.avatar}
                    alt={event.client.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>{event.client.name}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="space-y-2">
              <h3 className="text-gray-600 flex items-center gap-2">
                <span className="i-material-symbols-notes w-5 h-5" />
                Notes
              </h3>
              <p className="text-gray-600 italic">{event.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1 gap-2"
              onClick={() => {
                // Handle chat functionality
              }}
            >
              <span className="i-material-symbols-chat w-5 h-5" />
              Chat
            </Button>
            <Button
              variant="ghost"
              className="flex-1 gap-2"
              onClick={() => {
                // Handle edit functionality
              }}
            >
              <span className="i-material-symbols-edit w-5 h-5" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EventDialog
