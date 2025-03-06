import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Image, Calendar, Loader2, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import useCalendarStore from '../stores/calendarServerStore'
import chatUploadIcon from './assets/img/chat-upload.png'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import api from '../lib/api'
import { Link } from 'react-router-dom'

interface Message {
  id: string
  type: 'user' | 'system' | 'event-request'
  content: string
  timestamp: Date
  eventData?: EventData
}

interface EventData {
  date: string
  clientName: string
  tailor: string
  duration: number
  appointmentsNeeded: number
  inventoryNeeded: string
  notes: string
  measurements: string
  appointmentCreated?: boolean
  createdEventId?: string
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      type: 'system',
      content: 'Welcome to TailorMade chat! How can I help you today?',
      timestamp: new Date()
    }
  ])
  const [isUploading, setIsUploading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addEvent, calendars, events } = useCalendarStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return

    const newMessage: Message = {
      id: uuidv4(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Simulate a response after a short delay
    setTimeout(() => {
      const responseMessage: Message = {
        id: uuidv4(),
        type: 'system',
        content: 'I\'m here to help! If you have any tailoring notes or measurements, you can upload an image and I\'ll analyze it for you.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, responseMessage])
    }, 1000)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Show uploading message
    const uploadingMessage: Message = {
      id: uuidv4(),
      type: 'user',
      content: `Uploading image: ${file.name}...`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, uploadingMessage])
    setIsUploading(true)

    try {
      // Use the simplified API service
      const apiResponse = await api.note.upload(file);
      
      // Extract the event data from the response
      const eventData: EventData = apiResponse.data;

      // Create event request message
      const eventRequestMessage: Message = {
        id: uuidv4(),
        type: 'event-request',
        content: 'Based on the image you uploaded, I\'ve identified the following event details:',
        timestamp: new Date(),
        eventData
      }
      
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== uploadingMessage.id), // Remove uploading message
        {
          id: uuidv4(),
          type: 'user',
          content: `Uploaded image: ${file.name}`,
          timestamp: new Date()
        },
        eventRequestMessage
      ])

      // Show notification about error if there was one but we used mock data
      if (!apiResponse.success) {
        console.warn('API error (using mock data):', apiResponse.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle errors gracefully in the UI
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== uploadingMessage.id),
        {
          id: uuidv4(),
          type: 'system',
          content: `There was an error processing your image. Please try again.`,
          timestamp: new Date()
        }
      ])
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const createEvent = async (eventData: EventData) => {
    const eventDate = new Date(eventData.date)
    
    // Calculate end time based on duration (in minutes)
    const endDate = new Date(eventDate.getTime() + eventData.duration * 60000)
    
    const newEvent = {
      id: uuidv4(),
      title: `Fitting: ${eventData.clientName}`,
      start: eventDate,
      end: endDate,
      calendarId: calendars.length > 0 ? calendars[0].id : 'cal1', // Use first available calendar
      description: eventData.notes,
      location: '',
      allDay: false,
      state: 'busy' as const
    }
    
    // Add event to the calendar store
    await addEvent(newEvent)
    
    // Create the event ID for reference
    const createdEventId = newEvent.id
    
    // Confirm creation with a button to view the appointment
    const confirmMessage: Message = {
      id: uuidv4(),
      type: 'system',
      content: `Great! The appointment has been added to your calendar for ${format(eventDate, 'EEEE, MMMM d, yyyy')} at ${format(eventDate, 'h:mm a')}`,
      timestamp: new Date(),
      eventData: {
        ...eventData,
        // Add a flag to indicate this is a confirmation message that should have a button
        appointmentCreated: true,
        createdEventId
      }
    }
    
    setMessages(prev => [...prev, confirmMessage])
    
    return newEvent
  }

  // Function to render a message based on its type
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'user':
        return (
          <div className="flex justify-end mb-1.5 mb-1 xs:mb-0.5">
            <div className="bg-blue-500 text-white rounded-lg py-1 px-2 py-0.5 xs:py-0.5 px-1.5 xs:px-1 max-w-[80%]">
              <p className="text-sm">{message.content}</p>
              <span className="text-xs text-blue-100 block mt-0.5 xs:mt-0">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        )
      
      case 'system':
        return (
          <div className="flex justify-start mb-1.5 mb-1 xs:mb-0.5">
            <div className="bg-gray-200 text-gray-800 rounded-lg py-1 px-2 py-0.5 xs:py-0.5 px-1.5 xs:px-1 max-w-[80%]">
              <p className="text-sm">{message.content}</p>
              
              {/* Add button for appointment confirmation messages */}
              {message.eventData?.appointmentCreated && (
                <Link 
                  to="/app/calendar"
                  onClick={() => {
                    // Store the event ID and date in sessionStorage
                    if (message.eventData?.createdEventId) {
                      const eventId = message.eventData.createdEventId;
                      const event = events.find(e => e.id === eventId);
                      
                      sessionStorage.setItem('focusEventId', eventId);
                      if (event?.start) {
                        sessionStorage.setItem('calendarDate', new Date(event.start).toISOString());
                      }
                      sessionStorage.setItem('showEventDialog', 'true');
                    }
                    
                    // Close the chat modal
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center mt-1 mt-0.5 bg-blue-500 hover:bg-blue-600 text-white text-sm px-2 xs:px-1.5 py-0.5 xs:py-0.5 rounded-md"
                >
                  See new appointment
                </Link>
              )}
              
              <span className="text-xs text-gray-500 block mt-0.5 xs:mt-0">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        )
      
      case 'event-request':
        return (
          <div className="flex justify-start mb-1.5 mb-1 xs:mb-0.5">
            <div className="bg-white border border-gray-300 rounded-lg py-1.5 px-2 py-1 xs:py-0.5 px-1.5 xs:px-1 max-w-[85%] w-full shadow-sm">
              <p className="font-medium text-gray-800 mb-1 mb-0.5 xs:mb-0.5 text-sm">{message.content}</p>
              
              {message.eventData && (
                <div className="bg-gray-50 rounded p-1.5 p-1 xs:p-0.5 mb-1.5 mb-1 xs:mb-0.5 border border-gray-200">
                  <div className="flex items-start gap-1 mb-1 mb-0.5 xs:mb-0.5">
                    <Calendar className="w-4 h-4 w-3.5 xs:w-3 h-3.5 xs:h-3 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {format(new Date(message.eventData.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {format(new Date(message.eventData.date), 'h:mm a')} ({message.eventData.duration} minutes)
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 gap-1 xs:gap-0.5 mb-1.5 mb-1 xs:mb-0.5">
                    <div>
                      <p className="text-xs xs:text-[10px] text-gray-500">Client</p>
                      <p className="text-sm xs:text-xs">{message.eventData.clientName}</p>
                    </div>
                    <div>
                      <p className="text-xs xs:text-[10px] text-gray-500">Tailor</p>
                      <p className="text-sm xs:text-xs">{message.eventData.tailor}</p>
                    </div>
                  </div>
                  
                  <div className="mb-1.5 mb-1 xs:mb-0.5">
                    <p className="text-xs xs:text-[10px] text-gray-500">Notes</p>
                    <p className="text-sm xs:text-xs">{message.eventData.notes}</p>
                  </div>
                  
                  {message.eventData.inventoryNeeded !== "None" && (
                    <div className="mb-1.5 mb-1 xs:mb-0.5">
                      <p className="text-xs xs:text-[10px] text-gray-500">Inventory Needed</p>
                      <p className="text-sm xs:text-xs">{message.eventData.inventoryNeeded}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-1.5 gap-1 xs:gap-0.5 mt-1.5 mt-1 xs:mt-0.5">
                    <Button 
                      onClick={() => createEvent(message.eventData!)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm xs:text-xs py-0.5 xs:py-0.5 h-auto"
                    >
                      Add to Calendar
                    </Button>
                    <Button 
                      onClick={() => {
                        setMessages(prev => [...prev, {
                          id: uuidv4(),
                          type: 'system',
                          content: 'No problem! The appointment was not added.',
                          timestamp: new Date()
                        }])
                      }}
                      variant="outline"
                      className="text-sm xs:text-xs py-0.5 xs:py-0.5 h-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              <span className="text-xs text-gray-500 block mt-0.5 xs:mt-0">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <>
      {/* Chat button */}
      <img 
        src={chatUploadIcon} 
        alt="Chat" 
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full transition-all cursor-pointer"
        onClick={() => setIsOpen(true)}
      />

      {/* Chat window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 p-1 xs:p-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col h-[600px] max-h-[95vh] animate-in fade-in slide-in-from-bottom-10 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-2 p-1.5 xs:p-1 border-b">
              <h2 className="text-lg text-base font-semibold">TailorMade Assistant</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 xs:w-4 xs:h-4" />
              </button>
            </div>
            
            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-2 p-1.5 xs:p-1">
              {messages.map((message) => (
                <div key={message.id}>
                  {renderMessage(message)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <div className="p-1.5 p-1 xs:p-0.5 border-t">
              <div className="flex items-center gap-1 xs:gap-0.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 p-0.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-500"
                  disabled={isUploading}
                >
                  <Image className="w-5 h-5 xs:w-4 xs:h-4" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                  />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full border rounded-full px-2.5 py-1 px-2 xs:px-1.5 py-0.5 xs:py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="absolute right-2 right-1.5 xs:right-1 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 w-3.5 xs:w-3 h-3.5 xs:h-3 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleSendMessage}
                  className={cn(
                    "p-1 p-0.5 xs:p-0.5 rounded-full bg-blue-500 text-white",
                    inputValue.trim() === '' ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                  )}
                  disabled={inputValue.trim() === '' || isUploading}
                >
                  <Send className="w-4 h-4 w-3.5 xs:w-3 h-3.5 xs:h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatWidget 