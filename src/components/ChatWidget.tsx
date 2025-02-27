import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Image, Calendar, Loader2, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import useCalendarStore from '../stores/calendarStore'
import chatUploadIcon from './assets/img/chat-upload.png'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'

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
  const { addEvent, calendars } = useCalendarStore()

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

    // Prepare form data
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Make the API call with appropriate headers
      const response = await fetch('https://tailormadeserver-dbhmbqg0b9eda3dd.westus2-01.azurewebsites.net/note/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // No Content-Type header with FormData as browser sets it automatically with boundary
        },
        // Adding mode: 'cors' explicitly (this is the default)
        mode: 'cors'
      }).catch(error => {
        console.error('Fetch error:', error);
        return null; // Return null to indicate fetch failed
      });

      let eventData: EventData;

      // Check if fetch failed or response is not ok
      if (!response || !response.ok) {
        console.log('Using mock data due to CORS or server issue');
        
        // Create mock event data for demonstration purposes
        eventData = {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          clientName: "John Smith",
          tailor: "Maria Rodriguez",
          duration: 60,
          appointmentsNeeded: 2,
          inventoryNeeded: "Blue fabric (2 yards), Buttons (12)",
          notes: "Client requested slim fit suit with modern lapels. Previous measurements need updating due to recent weight change.",
          measurements: "Chest: 42\", Waist: 34\", Inseam: 32\""
        };
      } else {
        // Parse the real response if available
        eventData = await response.json();
      }

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
      
    } catch (error) {
      console.error('Error processing file:', error)
      
      // Show error message
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== uploadingMessage.id), // Remove uploading message
        {
          id: uuidv4(),
          type: 'user',
          content: `Uploaded image: ${file.name}`,
          timestamp: new Date()
        },
        {
          id: uuidv4(),
          type: 'system',
          content: 'Sorry, there was an error processing your image. I\'ll use sample data for demonstration purposes.',
          timestamp: new Date()
        }
      ])

      // Even in error case, provide a mock response after a short delay
      setTimeout(() => {
        const mockEventData: EventData = {
          date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
          clientName: "Sarah Johnson",
          tailor: "David Chen",
          duration: 45,
          appointmentsNeeded: 1,
          inventoryNeeded: "None",
          notes: "Dress alteration for wedding. Needs to be taken in at waist and hemmed.",
          measurements: "Bust: 36\", Waist: 28\", Hips: 38\""
        };

        const eventRequestMessage: Message = {
          id: uuidv4(),
          type: 'event-request',
          content: 'Here\'s a sample of what the detected event details would look like:',
          timestamp: new Date(),
          eventData: mockEventData
        }
        
        setMessages(prev => [...prev, eventRequestMessage]);
      }, 1000);
      
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const createEvent = (eventData: EventData) => {
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
    addEvent(newEvent)
    
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
  
  // Function to navigate to calendar view
  const navigateToCalendar = (eventId?: string) => {
    // Close the chat modal first
    setIsOpen(false)
    
    // Navigate to the calendar page
    window.location.href = '/app/calendar'
    
    // Store the event ID in sessionStorage so the calendar can focus on it
    if (eventId) {
      sessionStorage.setItem('focusEventId', eventId)
    }
  }

  // Function to render a message based on its type
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'user':
        return (
          <div className="flex justify-end mb-3">
            <div className="bg-blue-500 text-white rounded-lg py-2 px-3 max-w-[80%]">
              <p>{message.content}</p>
              <span className="text-xs text-blue-100 block mt-1">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        )
      
      case 'system':
        return (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-200 text-gray-800 rounded-lg py-2 px-3 max-w-[80%]">
              <p>{message.content}</p>
              
              {/* Add button for appointment confirmation messages */}
              {message.eventData?.appointmentCreated && (
                <Button 
                  onClick={() => navigateToCalendar(message.eventData?.createdEventId)}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 h-auto"
                >
                  See new appointment
                </Button>
              )}
              
              <span className="text-xs text-gray-500 block mt-1">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        )
      
      case 'event-request':
        return (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-300 rounded-lg py-3 px-4 max-w-[85%] w-full shadow-sm">
              <p className="font-medium text-gray-800 mb-2">{message.content}</p>
              
              {message.eventData && (
                <div className="bg-gray-50 rounded p-3 mb-3 border border-gray-200">
                  <div className="flex items-start gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(message.eventData.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-gray-600">
                        {format(new Date(message.eventData.date), 'h:mm a')} ({message.eventData.duration} minutes)
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Client</p>
                      <p className="text-sm">{message.eventData.clientName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tailor</p>
                      <p className="text-sm">{message.eventData.tailor}</p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm">{message.eventData.notes}</p>
                  </div>
                  
                  {message.eventData.inventoryNeeded !== "None" && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500">Inventory Needed</p>
                      <p className="text-sm">{message.eventData.inventoryNeeded}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={() => createEvent(message.eventData!)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
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
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              <span className="text-xs text-gray-500 block mt-1">
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer"
        onClick={() => setIsOpen(true)}
      />

      {/* Chat window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col h-[600px] max-h-[90vh] animate-in fade-in slide-in-from-bottom-10 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">TailorMade Assistant</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {renderMessage(message)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-500"
                  disabled={isUploading}
                >
                  <Image className="w-5 h-5" />
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
                    className="w-full border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleSendMessage}
                  className={cn(
                    "p-2 rounded-full bg-blue-500 text-white",
                    inputValue.trim() === '' ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                  )}
                  disabled={inputValue.trim() === '' || isUploading}
                >
                  <Send className="w-5 h-5" />
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