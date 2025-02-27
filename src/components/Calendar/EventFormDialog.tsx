import React, { useState, useEffect, ChangeEvent } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '@radix-ui/react-label'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { format, addMinutes, isValid } from 'date-fns'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Users,
  X,
  FileText,
  Tag
} from 'lucide-react'
import { Event } from '../../types'
import useCalendarStore from '../../stores/calendarStore'

interface FormData {
  title: string
  description: string
  start: Date
  end: Date
  calendarId: string
  location: string
  employee: string
  clientName: string
  notes: string
}

interface EventFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: {
    title: string
    description?: string
    start: Date
    end: Date
    calendarId: string
    location?: string
    employee?: string
    client?: {
      name: string
      avatar?: string
    }
    notes?: string
  }) => void
  initialDate?: Date
  event?: Event
  initialFormData?: Partial<Event> | null
}

const EventFormDialog: React.FC<EventFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate = new Date(),
  event,
  initialFormData = null
}) => {
  // Pull calendars from the calendar store
  const { calendars } = useCalendarStore()

  // Ensure dates are valid Date objects
  const getValidDate = (date: Date | string | undefined, fallback: Date): Date => {
    if (!date) return fallback
    const parsedDate = date instanceof Date ? date : new Date(date)
    return isValid(parsedDate) ? parsedDate : fallback
  }

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    start: initialDate,
    end: addMinutes(initialDate, 30),
    calendarId: 'cal1',
    location: '',
    employee: '',
    clientName: '',
    notes: ''
  })

  useEffect(() => {
    // Reset form data when dialog is opened/closed
    if (!isOpen) {
      // If dialog is closing, don't update the form
      return;
    }
    
    console.log('EventFormDialog isOpen, checking event data:', event ? 
      JSON.stringify({
        ...event,
        start: event.start instanceof Date ? event.start.toISOString() : String(event.start),
        end: event.end instanceof Date ? event.end.toISOString() : String(event.end),
        client: event.client ? {
          name: event.client.name,
          avatar: event.client.avatar || 'no avatar'
        } : 'No client data'
      }, null, 2) : 'No event data');
    
    if (initialFormData) {
      // Use initialFormData if provided (from alerts or other sources)
      const startDate = getValidDate(initialFormData.start, initialDate)
      const endDate = getValidDate(initialFormData.end, addMinutes(startDate, 30))
      
      const updatedFormData = {
        title: initialFormData.title || '',
        description: initialFormData.description || '',
        start: startDate,
        end: endDate,
        calendarId: initialFormData.calendarId || (calendars.length > 0 ? calendars[0].id : 'cal1'),
        location: initialFormData.location || '',
        employee: initialFormData.employee || '',
        clientName: initialFormData.client?.name || '',
        notes: initialFormData.notes || ''
      };
      
      console.log('Setting form data from initialFormData:', updatedFormData);
      setFormData(updatedFormData);
    }
    else if (event) {
      // Convert dates and ensure they're valid
      const startDate = getValidDate(event.start, initialDate)
      const endDate = getValidDate(event.end, addMinutes(startDate, 30))

      console.log('Event client data:', event.client ? 
        JSON.stringify({
          name: event.client.name,
          avatar: event.client.avatar
        }, null, 2) : 'No client data');
      console.log('Event employee data:', event.employee || 'No employee data');
      console.log('Event notes data:', event.notes || 'No notes data');
      
      // Set all form fields from the event
      const updatedFormData = {
        title: event.title || '',
        description: event.description || '',
        start: startDate,
        end: endDate,
        calendarId: event.calendarId || (calendars.length > 0 ? calendars[0].id : 'cal1'),
        location: event.location || '',
        employee: event.employee || '',
        clientName: event.client?.name || '',
        notes: event.notes || ''
      };
      
      console.log('Setting form data with values:', updatedFormData);
      
      setFormData(updatedFormData);
    } else {
      // Initialize with defaults for a new event
      setFormData({
        title: '',
        description: '',
        start: initialDate,
        end: addMinutes(initialDate, 30),
        calendarId: calendars.length > 0 ? calendars[0].id : 'cal1',
        location: '',
        employee: '',
        clientName: '',
        notes: ''
      })
    }
  }, [event, initialDate, initialFormData, isOpen, calendars])

  useEffect(() => {
    // Inspect DOM elements for employee, client name, and notes
    if (isOpen && event) {
      // Use a short timeout to let React update the DOM
      setTimeout(() => {
        const employeeInput = document.querySelector('input[name="employee"]') as HTMLInputElement;
        const clientNameInput = document.querySelector('input[name="clientName"]') as HTMLInputElement;
        const notesInput = document.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
        
        console.log('DOM element values after render:');
        console.log('Employee input value:', employeeInput?.value || 'Not found');
        console.log('Client name input value:', clientNameInput?.value || 'Not found');
        console.log('Notes textarea value:', notesInput?.value || 'Not found');
        
        const expectedEmployee = event.employee || '';
        const expectedClientName = event.client?.name || '';
        const expectedNotes = event.notes || '';
        
        // Check if values don't match what we expect
        if (employeeInput && employeeInput.value !== expectedEmployee && expectedEmployee) {
          console.log(`Employee value mismatch. Expected "${expectedEmployee}" but found "${employeeInput.value}". Forcing update.`);
          // Force a state update to fix the form values
          setFormData(prev => ({...prev, employee: expectedEmployee}));
        }
        
        if (clientNameInput && clientNameInput.value !== expectedClientName && expectedClientName) {
          console.log(`Client name value mismatch. Expected "${expectedClientName}" but found "${clientNameInput.value}". Forcing update.`);
          // Force a state update to fix the form values  
          setFormData(prev => ({...prev, clientName: expectedClientName}));
        }
        
        if (notesInput && notesInput.value !== expectedNotes && expectedNotes) {
          console.log(`Notes value mismatch. Expected "${expectedNotes}" but found "${notesInput.value}". Forcing update.`);
          // Force a state update to fix the form values
          setFormData(prev => ({...prev, notes: expectedNotes}));
        }
      }, 100);
    }
  }, [isOpen, event]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Only include non-empty optional fields
    const eventData = {
      title: formData.title,
      start: formData.start,
      end: formData.end,
      calendarId: formData.calendarId,
      ...(formData.description && { description: formData.description }),
      ...(formData.location && { location: formData.location }),
      ...(formData.employee && { employee: formData.employee }),
      ...(formData.clientName && {
        client: {
          name: formData.clientName,
          avatar: event?.client?.avatar || '/placeholder-avatar.jpg'
        }
      }),
      ...(formData.notes && { notes: formData.notes })
    }

    console.log('Submitting event data:', eventData);
    
    onSubmit(eventData)
    onClose()
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    console.log(`Input change for field "${name}": "${value}"`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    const currentStart = new Date(formData.start)
    const currentEnd = new Date(formData.end)
    
    // Keep the same time, just update the date
    newDate.setHours(currentStart.getHours(), currentStart.getMinutes())
    const newEnd = new Date(e.target.value)
    newEnd.setHours(currentEnd.getHours(), currentEnd.getMinutes())
    
    setFormData(prev => ({
      ...prev,
      start: newDate,
      end: newEnd
    }))
  }

  const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':')
    const newStart = new Date(formData.start)
    newStart.setHours(parseInt(hours), parseInt(minutes))
    
    // Ensure end time is at least 30 minutes after start time
    const newEnd = new Date(Math.max(formData.end.getTime(), addMinutes(newStart, 30).getTime()))
    
    setFormData(prev => ({
      ...prev,
      start: newStart,
      end: newEnd
    }))
  }

  const handleEndTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':')
    const newEnd = new Date(formData.end)
    newEnd.setHours(parseInt(hours), parseInt(minutes))
    
    // Ensure end time is not before start time
    if (newEnd <= formData.start) {
      newEnd.setTime(addMinutes(formData.start, 30).getTime())
    }
    
    setFormData(prev => ({
      ...prev,
      end: newEnd
    }))
  }

  const renderFormValue = (value: string) => {
    // Helper to log when a form value is rendered
    console.log(`Rendering form field with value: "${value}"`);
    return value;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0" hideCloseButton={true}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 py-4 pb-2 border-b">
            <DialogTitle className="text-2xl text-gray-700 font-medium flex items-center justify-between">
              <span>{event ? 'Edit Event' : 'New Event'}</span>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded-full">
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-gray-500 mt-1">
              {event ? 'Edit the details of your event' : 'Create a new event by filling out the details below'}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="mb-6">
              <input
                type="text"
                name="title"
                placeholder="Add title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full text-xl border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-gray-500 text-sm">Date</Label>
                    <input
                      type="date"
                      value={format(formData.start, 'yyyy-MM-dd')}
                      onChange={handleDateChange}
                      className="mt-1 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-gray-500 text-sm">Time</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="time"
                        value={format(formData.start, 'HH:mm')}
                        onChange={handleStartTimeChange}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={format(formData.end, 'HH:mm')}
                        onChange={handleEndTimeChange}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Tag className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-gray-500 text-sm">Calendar</Label>
                    <select
                      name="calendarId"
                      value={formData.calendarId}
                      onChange={handleInputChange}
                      className="mt-1 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {calendars.map(calendar => (
                        <option key={calendar.id} value={calendar.id}>
                          {calendar.emoji} {calendar.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-gray-500 text-sm">Location</Label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Add location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-gray-500 text-sm">Employee</Label>
                    <input
                      type="text"
                      name="employee"
                      placeholder="Add employee"
                      value={renderFormValue(formData.employee)}
                      onChange={handleInputChange}
                      className="mt-1 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Users className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-gray-500 text-sm">Client</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {formData.clientName && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder-avatar.jpg" alt={formData.clientName} />
                          <AvatarFallback>{formData.clientName[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <input
                        type="text"
                        name="clientName"
                        placeholder="Add client"
                        value={renderFormValue(formData.clientName)}
                        onChange={handleInputChange}
                        className="flex-1 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-gray-500 text-sm">Description</Label>
                    <textarea
                      name="description"
                      placeholder="Add description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1 flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-gray-500 text-sm">Notes</Label>
                    <textarea
                      name="notes"
                      placeholder="Add notes"
                      value={renderFormValue(formData.notes)}
                      onChange={handleInputChange}
                      className="mt-1 flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {event ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EventFormDialog 