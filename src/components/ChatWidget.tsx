import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Image, Calendar, Loader2, CheckCircle, ChevronDown, ChevronUp, FolderPlus, Clipboard, CheckSquare, Maximize, Minimize, Edit, Save, Plus, Trash } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import useCalendarStore from '../stores/calendarServerStore'
import chatUploadIcon from './assets/img/chat-upload.png'
import { v4 as uuidv4 } from 'uuid'
import { format, parse, addMinutes } from 'date-fns'
import api from '../lib/api'
import { Link, useNavigate } from 'react-router-dom'
import { Action, ActionState, ActionPriority, ActionType, Project, Event, ActionPriorityShim } from '../types'
import useProjectServerStore from '../stores/projectServerStore'

// Universal content type for chat messages
interface MessageContent {
  type: 'text' | 'appointment' | 'project' | 'action' | 'appointments' | 'actions';
  data: any;
  content?: string;
}

interface Message {
  id: string
  type: 'user' | 'system' | 'response'
  content: string | MessageContent
  timestamp: Date
}

// Legacy EventData interface for backward compatibility
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

// Add custom interfaces for the extended appointment and action types
interface ExtendedAppointment {
  id: string;
  projectId: string;
  date: Date;
  clientName: string;
  tailor: string;
  duration: number;
  description: string;
  notes?: string;
  location?: string;
  isEditing?: boolean;
  isNew?: boolean;
}

interface ExtendedAction extends Action {
  isEditing?: boolean;
  isNew?: boolean;
}

interface ExtendedProject extends Omit<Project, 'appointments' | 'actions'> {
  appointments: ExtendedAppointment[];
  actions: ExtendedAction[];
  created?: boolean;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      type: 'system',
      content: 'Hey Darren, how can I help you today?',
      timestamp: new Date()
    }
  ])
  const [isUploading, setIsUploading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addEvent, calendars, events } = useCalendarStore()
  const navigate = useNavigate()
  const [editingProject, setEditingProject] = useState<ExtendedProject | null>(null);
  const { create: createProject } = useProjectServerStore();

  // Helper function to determine if content is string or MessageContent
  const isStringContent = (content: string | MessageContent): content is string => {
    return typeof content === 'string';
  }

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

    // Generate a unique ID for this upload operation
    const uploadId = uuidv4()
    
    // Show enhanced uploading message with loading animation
    const uploadingMessage: Message = {
      id: uploadId,
      type: 'system',
      content: {
        type: 'text',
        data: { isLoading: true, fileName: file.name },
        content: 'Analyzing your image...'
      },
      timestamp: new Date()
    }
    setMessages(prev => [...prev, uploadingMessage])
    setIsUploading(true)

    try {
      // Use the project endpoint instead of appointment
      const apiResponse = await api.note.project(file);
      
      // Remove uploading message
      setMessages(prev => prev.filter(msg => msg.id !== uploadId));
      setIsUploading(false)
      
      // Add user message showing the uploaded file
      setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'user',
        content: `Uploaded image: ${file.name}`,
        timestamp: new Date()
      }]);
      
      if (apiResponse.success && apiResponse.data) {
        // Process the project data from the response
        const project = apiResponse.data;
        
        // Set the project in editing state with unique IDs for new items
        // Convert string dates to Date objects
        const preparedProject: ExtendedProject = {
          ...project,
          id: uuidv4(), // Generate new ID for the project
          dueDate: new Date(project.dueDate),
          appointments: (project.appointments || []).map((appt: any) => ({
            ...appt,
            id: uuidv4(), // Generate new ID for each appointment
            date: new Date(appt.date),
            isEditing: false,
            isNew: true
          })),
          actions: (project.actions || []).map((action: any) => ({
            ...action,
            id: uuidv4(), // Generate new ID for each action
            date: new Date(),
            confirmed: false,
            isEditing: false,
            isNew: true
          }))
        };
        
        setEditingProject(preparedProject);
        
        // Create project message with the editable project
        const projectMessage: Message = {
          id: uuidv4(),
          type: 'response',
          content: {
            type: 'project',
            data: preparedProject,
            content: 'Based on the image you uploaded, I\'ve identified the following project details. You can edit them before creating the project:'
          },
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, projectMessage]);
      } else {
        // Handle error
        setMessages(prev => [...prev, {
          id: uuidv4(),
          type: 'system',
          content: 'I couldn\'t analyze the image properly. Please try again or upload a clearer image.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('File upload error:', error);
      
      // Remove uploading message
      setMessages(prev => prev.filter(msg => msg.id !== uploadId));
      setIsUploading(false)
      
      // Show error message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'system',
        content: 'Sorry, there was an error processing your image. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const createEvent = async (eventData: EventData) => {
    const eventDate = new Date(eventData.date)
    
    // Calculate end time based on duration (in minutes)    
    const newEvent = {
      ...eventData,
      id: uuidv4(),
      title: `Fitting: ${eventData.clientName}`,
      start: eventDate,
      calendarId: calendars.length > 0 ? calendars[0].id : 'cal1', // Use first available calendar
      description: eventData.notes,
      allDay: false,
      state: 'busy' as const,
      notes: '',
    }
    
    // Add event to the calendar store
    await addEvent(newEvent)
    
    // Create the event ID for reference
    const createdEventId = newEvent.id
    
    // Confirm creation with a button to view the appointment
    const confirmMessage: Message = {
      id: uuidv4(),
      type: 'system',
      timestamp: new Date(),
      content: {
        type: 'appointment',
        data: {
          ...eventData,
          appointmentCreated: true,
          createdEventId
        },
        content: `Great! The appointment has been added to your calendar for ${format(eventDate, 'EEEE, MMMM d, yyyy')} at ${format(eventDate, 'h:mm a')}`
      }
    }
    
    setMessages(prev => [...prev, confirmMessage])
    
    return newEvent
  }

  // Update the project creation function
  const handleCreateProject = async (project: ExtendedProject) => {
    try {
      // Create a copy of the project to submit
      const projectToSubmit = {
        ...project,
        // Convert appointments to the format expected by the server
        appointments: project.appointments.map(appt => ({
          id: appt.id,
          projectId: project.id,
          date: appt.date,
          clientName: project.clientName,
          tailor: appt.tailor,
          duration: appt.duration,
          description: appt.description,
          notes: appt.notes || '',
          location: appt.location || ''
        })),
        // Convert actions to the format expected by the server
        actions: project.actions.map(action => ({
          id: action.id,
          name: action.name,
          description: action.description,
          type: action.type,
          priority: action.priority,
          state: action.state,
          date: action.date,
          confirmed: action.confirmed
        }))
      };
      
      // Create the project
      await createProject(projectToSubmit as unknown as Project);
      
      // Update the message to show that the project was created
      setMessages(prev => prev.map(msg => {
        if (!isStringContent(msg.content) && 
            msg.content.type === 'project' && 
            msg.content.data.id === project.id) {
          return {
            ...msg,
            content: {
              ...msg.content,
              data: {
                ...msg.content.data,
                created: true
              }
            }
          };
        }
        return msg;
      }));
      
      // Add confirmation message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'system',
        content: `Project "${project.name}" has been created successfully with ${project.appointments.length} appointments and ${project.actions.length} actions.`,
        timestamp: new Date()
      }]);
      
      // Clear the editing project
      setEditingProject(null);
    } catch (error) {
      console.error('Failed to create project:', error);
      
      // Show error message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'system',
        content: 'There was an error creating the project. Please try again.',
        timestamp: new Date()
      }]);
    }
  };

  // Update the project helper functions
  const updateProjectField = (project: ExtendedProject, field: keyof ExtendedProject, value: any) => {
    if (!editingProject) return;
    
    const updatedProject = {
      ...editingProject,
      [field]: value
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  // Update appointment helper functions
  const addAppointment = (project: ExtendedProject) => {
    if (!editingProject) return;
    
    const newAppointment = {
      id: uuidv4(),
      projectId: project.id,
      date: new Date(),
      clientName: project.clientName,
      tailor: '',
      duration: 60,
      description: '',
      notes: '',
      location: '',
      isEditing: true,
      isNew: true
    };
    
    const updatedProject = {
      ...editingProject,
      appointments: [...editingProject.appointments, newAppointment]
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  const updateAppointment = (project: ExtendedProject, appointmentId: string, field: string, value: any) => {
    if (!editingProject) return;
    
    const updatedProject = {
      ...editingProject,
      appointments: editingProject.appointments.map(appt => {
        if (appt.id === appointmentId) {
          return {
            ...appt,
            [field]: value
          };
        }
        return appt;
      })
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  const toggleAppointmentEdit = (project: ExtendedProject, appointmentId: string) => {
    if (!editingProject) return;
    
    const updatedProject = {
      ...editingProject,
      appointments: editingProject.appointments.map(appt => {
        if (appt.id === appointmentId) {
          return {
            ...appt,
            isEditing: !appt.isEditing
          };
        }
        return appt;
      })
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  const removeAppointment = (project: ExtendedProject, appointmentId: string) => {
    if (!editingProject) return;
    
    const updatedProject = {
      ...editingProject,
      appointments: editingProject.appointments.filter(appt => appt.id !== appointmentId)
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  // Update action helper functions
  const addAction = (project: ExtendedProject) => {
    if (!editingProject) return;
    
    const newAction = {
      id: uuidv4(),
      name: '',
      description: '',
      type: ActionType.OrderInventory,
      priority: ActionPriority.Medium,
      state: ActionState.Todo,
      date: new Date(),
      confirmed: false,
      isEditing: true,
      isNew: true
    };
    
    const updatedProject = {
      ...editingProject,
      actions: [...editingProject.actions, newAction]
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  const updateAction = (project: ExtendedProject, actionId: string, field: string, value: any) => {
    if (!editingProject) return;
    
    const updatedProject = {
      ...editingProject,
      actions: editingProject.actions.map(action => {
        if (action.id === actionId) {
          return {
            ...action,
            [field]: value
          };
        }
        return action;
      })
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  const toggleActionEdit = (project: ExtendedProject, actionId: string) => {
    if (!editingProject) return;
    
    const updatedProject = {
      ...editingProject,
      actions: editingProject.actions.map(action => {
        if (action.id === actionId) {
          return {
            ...action,
            isEditing: !action.isEditing
          };
        }
        return action;
      })
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  const removeAction = (project: ExtendedProject, actionId: string) => {
    if (!editingProject) return;
    
    const updatedProject = {
      ...editingProject,
      actions: editingProject.actions.filter(action => action.id !== actionId)
    };
    
    setEditingProject(updatedProject);
    
    // Update the message with the edited project
    setMessages(prev => prev.map(msg => {
      if (!isStringContent(msg.content) && 
          msg.content.type === 'project' && 
          msg.content.data.id === project.id) {
        return {
          ...msg,
          content: {
            ...msg.content,
            data: updatedProject
          }
        };
      }
      return msg;
    }));
  };

  // Render message based on type
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'user':
        return (
          <div className="flex justify-end mb-1.5 mb-1 xs:mb-0.5">
            <div className="bg-blue-500 text-white rounded-lg py-1 px-2 py-0.5 xs:py-0.5 px-1.5 xs:px-1 max-w-[80%]">
              <p className="text-sm">{isStringContent(message.content) ? message.content : message.content.content}</p>
              <span className="text-xs text-blue-100 block mt-0.5 xs:mt-0">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        )
      
      case 'system':
        if (!isStringContent(message.content) && message.content.type === 'text' && message.content.data?.isLoading) {
          // Enhanced loading visualization
          return (
            <div className="flex justify-start mb-1.5 mb-1 xs:mb-0.5">
              <div className="bg-gray-200 text-gray-800 rounded-lg py-1 px-2 py-0.5 xs:py-0.5 px-1.5 xs:px-1 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-sm">{message.content.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Analyzing: {message.content.data.fileName}</p>
                <span className="text-xs text-gray-500 block mt-0.5 xs:mt-0">
                  {format(message.timestamp, 'h:mm a')}
                </span>
              </div>
            </div>
          );
        }
        
        return (
          <div className="flex justify-start mb-1.5 mb-1 xs:mb-0.5">
            <div className="bg-gray-200 text-gray-800 rounded-lg py-1 px-2 py-0.5 xs:py-0.5 px-1.5 xs:px-1 max-w-[80%]">
              <p className="text-sm">{isStringContent(message.content) ? message.content : message.content.content}</p>
              
              {/* Add button for appointment confirmation messages */}
              {!isStringContent(message.content) && 
               message.content.type === 'appointment' && 
               'appointmentCreated' in message.content.data && 
               message.content.data.appointmentCreated && (
                <Link 
                  to="/app/calendar"
                  onClick={() => {
                    // Store the event ID and date in sessionStorage
                    if (!isStringContent(message.content) && 
                        'createdEventId' in message.content.data && 
                        message.content.data.createdEventId) {
                      const eventId = message.content.data.createdEventId;
                      const event = events.find(e => e.id === eventId);
                      
                      sessionStorage.setItem('focusEventId', eventId);
                      if (event && 'start' in event) {
                        const eventStart = event.start;
                        sessionStorage.setItem('calendarDate', new Date(eventStart).toISOString());
                      }
                      sessionStorage.setItem('showEventDialog', 'true');
                    }
                    
                    // Close the chat modal
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-blue-500 text-xs underline mt-1.5 mt-1 xs:mt-0.5"
                >
                  <Calendar className="w-3 h-3" />
                  View in Calendar
                </Link>
              )}
              
              <span className="text-xs text-gray-500 block mt-0.5 xs:mt-0">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        )
      
      case 'response':
        if (!isStringContent(message.content)) {
          if (message.content.type === 'appointment') {
            return (
              <div className="flex justify-start mb-1.5 mb-1 xs:mb-0.5">
                <div className="bg-white border border-gray-300 rounded-lg py-1.5 px-2 py-1 xs:py-0.5 px-1.5 xs:px-1 max-w-[85%] w-full shadow-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800 mb-1 mb-0.5 xs:mb-0.5 text-sm">Appointment Details</p>
                    {!message.content.data.appointmentCreated && (
                      <Button 
                        onClick={() => setIsFullScreen(!isFullScreen)} 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-gray-500"
                      >
                        {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  
                  <div className={cn(
                    "bg-gray-50 rounded p-1.5 p-1 xs:p-0.5 mb-1.5 mb-1 xs:mb-0.5 border border-gray-200",
                    isFullScreen && "fixed inset-0 z-50 p-4 bg-white overflow-auto"
                  )}>
                    {isFullScreen && (
                      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white p-2 border-b">
                        <h2 className="text-lg font-semibold">Appointment Details</h2>
                        <Button 
                          onClick={() => setIsFullScreen(false)} 
                          variant="ghost" 
                          size="icon"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  
                    <div className="flex items-start gap-1 mb-1 mb-0.5 xs:mb-0.5">
                      <Calendar className="w-4 h-4 w-3.5 xs:w-3 h-3.5 xs:h-3 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {format(new Date(message.content.data.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {format(new Date(message.content.data.date), 'h:mm a')} ({message.content.data.duration} minutes)
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5 gap-1 xs:gap-0.5 mb-1.5 mb-1 xs:mb-0.5">
                      <div>
                        <p className="text-xs xs:text-[10px] text-gray-500">Client</p>
                        <p className="text-sm xs:text-xs">{message.content.data.clientName}</p>
                      </div>
                      <div>
                        <p className="text-xs xs:text-[10px] text-gray-500">Tailor</p>
                        <p className="text-sm xs:text-xs">{message.content.data.tailor}</p>
                      </div>
                    </div>
                    
                    <div className="mb-1.5 mb-1 xs:mb-0.5">
                      <p className="text-xs xs:text-[10px] text-gray-500">Notes</p>
                      <p className="text-sm xs:text-xs">{message.content.data.notes}</p>
                    </div>
                    
                    {message.content.data.inventoryNeeded && message.content.data.inventoryNeeded !== "None" && (
                      <div className="mb-1.5 mb-1 xs:mb-0.5">
                        <p className="text-xs xs:text-[10px] text-gray-500">Inventory Needed</p>
                        <p className="text-sm xs:text-xs">{message.content.data.inventoryNeeded}</p>
                      </div>
                    )}
                    
                    {!message.content.data.appointmentCreated && (
                      <div className="flex gap-1.5 gap-1 xs:gap-0.5 mt-1.5 mt-1 xs:mt-0.5">
                        <Button 
                          onClick={() => {
                            if (!isStringContent(message.content)) {
                              createEvent(message.content.data as EventData);
                            }
                          }}
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
                    )}
                  </div>
                  
                  <span className="text-xs text-gray-500 block mt-0.5 xs:mt-0">
                    {format(message.timestamp, 'h:mm a')}
                  </span>
                </div>
              </div>
            )
          } else if (message.content.type === 'project') {
            // Project Card
            const project = message.content.data as ExtendedProject;
            const isCreated = project.created === true;
            
            return (
              <div className="flex justify-start mb-1.5 mb-1 xs:mb-0.5">
                <div className="bg-white border border-gray-300 rounded-lg py-1.5 px-2 py-1 xs:py-0.5 px-1.5 xs:px-1 max-w-[85%] w-full shadow-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800 mb-1 mb-0.5 xs:mb-0.5 text-sm">Project Details</p>
                    <Button 
                      onClick={() => setIsFullScreen(!isFullScreen)} 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-gray-500"
                    >
                      {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className={cn(
                    "bg-gray-50 rounded p-1.5 p-1 xs:p-0.5 mb-1.5 mb-1 xs:mb-0.5 border border-gray-200",
                    isFullScreen && "fixed inset-0 z-50 p-4 bg-white overflow-auto"
                  )}>
                    {isFullScreen && (
                      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white p-2 border-b">
                        <h2 className="text-lg font-semibold">{project.name}</h2>
                        <Button 
                          onClick={() => setIsFullScreen(false)} 
                          variant="ghost" 
                          size="icon"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  
                    {/* Project Fields - Editable Mode */}
                    <div className="mb-2">
                      <div className="mb-1">
                        <p className="text-xs text-gray-500">Project Name</p>
                        <input
                          type="text"
                          value={project.name}
                          onChange={(e) => updateProjectField(project, 'name', e.target.value)}
                          disabled={isCreated}
                          className="w-full p-1 text-sm border rounded"
                        />
                      </div>
                      <div className="mb-1">
                        <p className="text-xs text-gray-500">Description</p>
                        <textarea
                          value={project.description}
                          onChange={(e) => updateProjectField(project, 'description', e.target.value)}
                          disabled={isCreated}
                          className="w-full p-1 text-sm border rounded min-h-[100px]"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Client</p>
                        <input
                          type="text"
                          value={project.clientName}
                          onChange={(e) => updateProjectField(project, 'clientName', e.target.value)}
                          disabled={isCreated}
                          className="w-full p-1 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Client Email</p>
                        <input
                          type="email"
                          value={project.clientEmail}
                          onChange={(e) => updateProjectField(project, 'clientEmail', e.target.value)}
                          disabled={isCreated}
                          className="w-full p-1 text-sm border rounded"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Client Cost ($)</p>
                        <input
                          type="number"
                          value={project.clientCost}
                          onChange={(e) => updateProjectField(project, 'clientCost', parseFloat(e.target.value) || 0)}
                          disabled={isCreated}
                          className="w-full p-1 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <input
                          type="date"
                          value={format(new Date(project.dueDate), 'yyyy-MM-dd')}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : new Date();
                            updateProjectField(project, 'dueDate', date);
                          }}
                          disabled={isCreated}
                          className="w-full p-1 text-sm border rounded"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-xs text-gray-500">Measurements</p>
                      <textarea
                        value={project.measurements}
                        onChange={(e) => updateProjectField(project, 'measurements', e.target.value)}
                        disabled={isCreated}
                        className="w-full p-1 text-sm border rounded min-h-[60px]"
                      />
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-xs text-gray-500">Inventory Needed</p>
                      <textarea
                        value={project.inventoryNeeded}
                        onChange={(e) => updateProjectField(project, 'inventoryNeeded', e.target.value)}
                        disabled={isCreated}
                        className="w-full p-1 text-sm border rounded"
                      />
                    </div>
                    
                    {/* Appointments Section */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-md font-semibold text-gray-700">Appointments ({project.appointments?.length || 0})</p>
                        {!isCreated && (
                          <Button 
                            onClick={() => addAppointment(project)}
                            variant="outline"
                            size="sm"
                            className="h-5 text-xs flex items-center"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {project.appointments?.map((appointment) => (
                          <div key={appointment.id} className="bg-white rounded border p-2 text-sm">
                            {appointment.isEditing ? (
                              // Edit mode
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Date</p>
                                    <input
                                      type="date"
                                      value={format(new Date(appointment.date), 'yyyy-MM-dd')}
                                      onChange={(e) => {
                                        // Preserve the time while changing the date
                                        const oldDate = new Date(appointment.date);
                                        const newDate = new Date(e.target.value);
                                        newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
                                        updateAppointment(project, appointment.id, 'date', newDate);
                                      }}
                                      className="w-full p-1 text-xs border rounded"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Time</p>
                                    <input
                                      type="time"
                                      value={format(new Date(appointment.date), 'HH:mm')}
                                      onChange={(e) => {
                                        // Preserve the date while changing the time
                                        const oldDate = new Date(appointment.date);
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        oldDate.setHours(hours, minutes);
                                        updateAppointment(project, appointment.id, 'date', oldDate);
                                      }}
                                      className="w-full p-1 text-xs border rounded"
                                    />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Tailor</p>
                                    <input
                                      type="text"
                                      value={appointment.tailor}
                                      onChange={(e) => updateAppointment(project, appointment.id, 'tailor', e.target.value)}
                                      className="w-full p-1 text-xs border rounded"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Duration (min)</p>
                                    <input
                                      type="number"
                                      value={appointment.duration}
                                      onChange={(e) => updateAppointment(project, appointment.id, 'duration', parseInt(e.target.value) || 30)}
                                      min="15"
                                      step="15"
                                      className="w-full p-1 text-xs border rounded"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-xs text-gray-500">Description</p>
                                  <textarea
                                    value={appointment.description}
                                    onChange={(e) => updateAppointment(project, appointment.id, 'description', e.target.value)}
                                    className="w-full p-1 text-xs border rounded min-h-[40px]"
                                  />
                                </div>
                                
                                <div>
                                  <p className="text-xs text-gray-500">Notes</p>
                                  <textarea
                                    value={appointment.notes}
                                    onChange={(e) => updateAppointment(project, appointment.id, 'notes', e.target.value)}
                                    className="w-full p-1 text-xs border rounded min-h-[40px]"
                                  />
                                </div>
                                
                                <div>
                                  <p className="text-xs text-gray-500">Location</p>
                                  <input
                                    type="text"
                                    value={appointment.location}
                                    onChange={(e) => updateAppointment(project, appointment.id, 'location', e.target.value)}
                                    className="w-full p-1 text-xs border rounded"
                                  />
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button 
                                    onClick={() => toggleAppointmentEdit(project, appointment.id)}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    Done
                                  </Button>
                                  <Button 
                                    onClick={() => removeAppointment(project, appointment.id)}
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    <Trash className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <>
                                <div className="flex justify-between">
                                  <span className="font-medium">{format(new Date(appointment.date), 'MMM d, h:mm a')}</span>
                                  <span>{appointment.duration} min</span>
                                </div>
                                <div className="mb-1">
                                  <span className="text-xs text-gray-600">Tailor: {appointment.tailor}</span>
                                </div>
                                <p className="text-gray-600 text-xs mb-1">{appointment.description}</p>
                                {!isCreated && (
                                  <div className="flex justify-end">
                                    <Button 
                                      onClick={() => toggleAppointmentEdit(project, appointment.id)} 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 text-xs p-1"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Actions Section */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-md font-semibold text-gray-700">Assistant Actions ({project.actions?.length || 0})</p>
                        {!isCreated && (
                          <Button 
                            onClick={() => addAction(project)}
                            variant="outline"
                            size="sm"
                            className="h-5 text-xs flex items-center"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {project.actions?.map((action) => (
                          <div key={action.id} className="bg-white rounded border p-2 text-sm">
                            {action.isEditing ? (
                              // Edit mode
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-gray-500">Name</p>
                                  <input
                                    type="text"
                                    value={action.name}
                                    onChange={(e) => updateAction(project, action.id, 'name', e.target.value)}
                                    className="w-full p-1 text-xs border rounded"
                                  />
                                </div>
                                
                                <div>
                                  <p className="text-xs text-gray-500">Description</p>
                                  <textarea
                                    value={action.description}
                                    onChange={(e) => updateAction(project, action.id, 'description', e.target.value)}
                                    className="w-full p-1 text-xs border rounded min-h-[40px]"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Priority</p>
                                    <select
                                      value={action.priority}
                                      onChange={(e) => updateAction(project, action.id, 'priority', e.target.value)}
                                      className="w-full p-1 text-xs border rounded"
                                    >
                                      <option value={ActionPriority.Low}>Low</option>
                                      <option value={ActionPriority.Medium}>Medium</option>
                                      <option value={ActionPriority.High}>High</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button 
                                    onClick={() => toggleActionEdit(project, action.id)}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    Done
                                  </Button>
                                  <Button 
                                    onClick={() => removeAction(project, action.id)}
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    <Trash className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    action.state === ActionState.Done ? "bg-green-500" : 
                                    action.state === ActionState.InProgress ? "bg-yellow-500" : "bg-gray-500"
                                  )} />
                                  <span className="font-medium">{action.name}</span>
                                </div>
                                <p className="text-gray-600 text-xs mb-1">{action.description}</p>
                                <div className="flex items-center text-xs text-gray-500 mb-1">
                                  <span className="mr-2">Priority: {ActionPriorityShim[action.priority]}</span>
                                </div>
                                {!isCreated && (
                                  <div className="flex justify-end">
                                    <Button 
                                      onClick={() => toggleActionEdit(project, action.id)} 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 text-xs p-1"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      value={action.state}
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => updateAction(project, action.id, 'confirmed', true)}
                                      className="h-6 text-xs p-1"
                                    >
                                      <CheckSquare className="h-3 w-3 mr-1" />
                                      {action.confirmed ? 'Confirmed' : 'Confirm'}
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      {!isCreated ? (
                        <>
                          <Button 
                            onClick={() => handleCreateProject(project)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm h-auto py-1"
                          >
                            <FolderPlus className="w-4 h-4 mr-1" />
                            Create Project
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setMessages(prev => [...prev, {
                                id: uuidv4(),
                                type: 'system',
                                content: 'No problem! The project was not added.',
                                timestamp: new Date()
                              }]);
                              setEditingProject(null);
                            }}
                            className="text-sm h-auto py-1"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => {
                            navigate(`/app/projects/${project.id}`);
                            setIsOpen(false);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-sm h-auto py-1"
                        >
                          <FolderPlus className="w-4 h-4 mr-1" />
                          View Project
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <span className="text-xs text-gray-500 block mt-0.5 xs:mt-0">
                    {format(message.timestamp, 'h:mm a')}
                  </span>
                </div>
              </div>
            );
          }
        }
        return null;
      
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