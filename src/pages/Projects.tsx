import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Project, ActionState, Event, ActionStateShim } from '../types'
import useProjectServerStore from '../stores/projectServerStore'
import { format, isPast } from 'date-fns'
import { Calendar, Clock, Users, FileText, ArrowLeft, Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'
import EventViewDialog from '../components/Calendar/EventViewDialog'
import PageLayout from '../components/PageLayout'
import DebugInfo from '../components/DebugInfo'

// Define the Appointment interface based on the API schema
interface Appointment {
  id: string;
  projectId?: string;
  date: string | Date;
  clientName?: string;
  tailor?: string;
  duration: number;
  description?: string;
  notes?: string;
  location?: string;
}

// Enhanced Event interface to accommodate data from different sources
interface EnhancedEvent extends Event {
  date?: string | Date;
  duration?: number;
  data?: {
    date?: string | Date;
    eventDate?: string | Date;
    duration?: number;
    description?: string;
    employee?: string;
    notes?: string;
    location?: string;
    client?: {
      name?: string;
    };
    appointmentCreated?: boolean;
    createdEventId?: string;
  };
}

// Initial empty project template
const emptyProject: Omit<Project, 'id' | 'actions' | 'appointments'> = {
  name: '',
  description: '',
  clientName: '',
  clientEmail: '',
  clientCost: 0,
  inventoryNeeded: 0,
  appointmentsNeeded: 0,
  measurements: '',
  notes: '',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default due date is 30 days from now
}

// Add UUID validation function
const isValidUUID = (uuid: string): boolean => {
  // More lenient validation - just check if it looks like a UUID
  // This should allow standard UUIDs without being too strict
  return typeof uuid === 'string' && uuid.length > 30 && uuid.includes('-');
}

// Add a component error boundary to prevent the entire UI from disappearing
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ProjectErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Project component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <PageLayout title="Error">
          <div className="p-6 flex-1">
            <Link to="/app/projects" className="flex items-center text-blue-500 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Projects
            </Link>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              <AlertTriangle className="h-6 w-6 inline-block mr-2" />
              <p className="font-medium">Something went wrong</p>
              <p className="mt-1">An error occurred while rendering the project page.</p>
              {import.meta.env.DEV && this.state.error && (
                <pre className="mt-2 bg-red-100 p-2 rounded overflow-auto text-xs">
                  {this.state.error.message || this.state.error.toString()}
                </pre>
              )}
            </div>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </PageLayout>
      );
    }

    return this.props.children;
  }
}

const ProjectsWrapper: React.FC = () => {
  return (
    <ProjectErrorBoundary>
      <Projects />
    </ProjectErrorBoundary>
  );
};

const Projects: React.FC = () => {
  const { projects, fetchProjects, create, update, remove } = useProjectServerStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentProject, setCurrentProject] = useState<Partial<Project>>(emptyProject)
  const [formError, setFormError] = useState('')
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  
  // Add state for appointment detail dialog
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
  
  // Load projects data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        console.log("Loading projects data...")
        await fetchProjects()
        console.log("Projects loaded successfully")
      } catch (err) {
        console.error("Error loading projects:", err)
        setError('Failed to load projects. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    // Always load projects on component mount
    loadData();
    
  }, [fetchProjects]) // Remove projectId and projects.length from dependencies
  
  // Function to reload projects data if there was an error
  const reloadProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await fetchProjects()
      setIsLoading(false)
    } catch (err) {
      console.error("Error reloading projects:", err)
      setError('Failed to reload projects. Please try again.')
      setIsLoading(false)
    }
  }

  // Debug log for projectId and loaded projects
  useEffect(() => {
    if (projectId) {
      console.log("Current projectId from URL:", projectId)
      console.log("Loaded projects:", projects)
      
      const project = projects.find(p => p.id === projectId)
      if (project) {
        console.log("Found matching project:", project)
      } else {
        console.log("No matching project found for ID:", projectId)
      }
    }
  }, [projectId, projects])

  // Reset the form when the create modal is opened
  useEffect(() => {
    if (showCreateForm) {
      setCurrentProject(emptyProject)
      setFormError('')
    }
  }, [showCreateForm])

  // Set the current project when the edit modal is opened
  useEffect(() => {
    if (showEditForm && projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        setCurrentProject(project)
        setFormError('')
      }
    }
  }, [showEditForm, projectId, projects])

  // Handle project form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setCurrentProject(prev => ({
      ...prev,
      [name]: name === 'clientCost' || name === 'appointmentsNeeded' 
        ? parseInt(value) || 0 
        : value
    }))
  }

  // Handle project form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    try {
      if (!currentProject.name || !currentProject.clientName) {
        setFormError('Project name and client name are required')
        return
      }

      if (showCreateForm) {
        // For new projects, we need to create with empty arrays for actions and appointments
        const newProject = {
          ...currentProject,
          id: crypto.randomUUID(), // Generate a UUID for new projects
          actions: [],
          appointments: []
        } as Project

        await create(newProject)
        setShowCreateForm(false)
        // Navigate to the new project if successful
        navigate(`/app/projects/${newProject.id}`)
      } else if (showEditForm && projectId) {
        // For existing projects, preserve the id, actions, and appointments
        const updatedProject = {
          ...projects.find(p => p.id === projectId),
          ...currentProject,
        } as Project

        await update(updatedProject)
        setShowEditForm(false)
      }
    } catch (error) {
      setFormError('Failed to save project. Please try again.')
      console.error('Project save error:', error)
    }
  }

  // Handle project deletion
  const handleDelete = async () => {
    if (!projectId) return

    try {
      await remove(projectId)
      setShowDeleteConfirm(false)
      navigate('/app/projects')
    } catch (error) {
      console.error('Project delete error:', error)
    }
  }

  // Handle click on an appointment card
  const handleAppointmentClick = (appointment: EnhancedEvent) => {
    try {
      // Enhanced date handling for appointment data
      const getAppointmentDate = (appt: EnhancedEvent) => {
        if (appt.start) return new Date(appt.start);
        if (appt.date) return new Date(appt.date);
        if (appt.data?.date) return new Date(appt.data.date);
        if (appt.data?.eventDate) return new Date(appt.data.eventDate);
        
        console.error("No valid date found in appointment:", appt);
        return new Date();
      };
      
      const getDuration = (appt: EnhancedEvent, startDate: Date) => {
        if (appt.duration) return appt.duration;
        if (appt.data?.duration) return appt.data.duration;
        if (appt.end) return Math.round((new Date(appt.end).getTime() - startDate.getTime()) / 60000);
        return 30; // Default to 30 minutes
      };
      
      const startDate = getAppointmentDate(appointment);
      const duration = getDuration(appointment, startDate);
      
      // Log the appointment for debugging
      console.debug("Clicked appointment:", appointment, "Start date:", startDate, "Duration:", duration);
      
      // Convert Event to Appointment format
      const appointmentData: Appointment = {
        id: appointment.id,
        projectId: projectId,
        date: startDate,
        clientName: appointment.client?.name || appointment.data?.client?.name,
        tailor: appointment.employee || appointment.data?.employee,
        duration: duration,
        description: appointment.description || appointment.data?.description,
        notes: appointment.notes || appointment.data?.notes,
        location: appointment.location || appointment.data?.location
      };
      
      setSelectedAppointment(appointmentData);
      setIsAppointmentDialogOpen(true);
    } catch (error) {
      console.error("Error handling appointment click:", error, appointment);
    }
  }

  // Handle editing an appointment
  const handleEditAppointment = () => {
    // For now, redirect to the calendar page for editing
    // In a future enhancement, we could add the appointment edit form here
    setIsAppointmentDialogOpen(false)
    
    if (selectedAppointment) {
      sessionStorage.setItem('focusEventId', selectedAppointment.id)
      sessionStorage.setItem('calendarDate', new Date(selectedAppointment.date).toISOString())
      sessionStorage.setItem('showEventDialog', 'true')
      navigate('/app/calendar')
    }
  }

  // Handle viewing the appointment in the calendar
  const handleViewInCalendar = () => {
    if (selectedAppointment) {
      // Set the same session storage items but don't show the dialog initially
      // This will focus on the date in the calendar but not immediately open the event dialog
      sessionStorage.setItem('focusEventId', selectedAppointment.id)
      sessionStorage.setItem('calendarDate', new Date(selectedAppointment.date).toISOString())
      sessionStorage.setItem('showEventDialog', 'false') // Don't show event dialog initially
      
      // Close the current dialog and navigate to the calendar
      setIsAppointmentDialogOpen(false)
      navigate('/app/calendar')
    }
  }

  // Handle deleting an appointment
  const handleDeleteAppointment = async () => {
    if (!selectedAppointment || !projectId) return
    
    try {
      // Find the project to update
      const project = projects.find(p => p.id === projectId)
      if (!project) return
      
      // Filter out the appointment to delete
      const updatedAppointments = project.appointments.filter(
        app => app.id !== selectedAppointment.id
      )
      
      // Update the project with the new appointments array
      const updatedProject = {
        ...project,
        appointments: updatedAppointments
      }
      
      // Save the updated project
      await update(updatedProject)
      
      // Close the dialog
      setIsAppointmentDialogOpen(false)
      setSelectedAppointment(null)
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  // Project form component
  const ProjectForm = ({ isCreate = false }: { isCreate?: boolean }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{isCreate ? 'Create New Project' : 'Edit Project'}</h2>
          <button 
            onClick={() => isCreate ? setShowCreateForm(false) : setShowEditForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
              <input
                type="text"
                name="name"
                value={currentProject.name || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name*</label>
              <input
                type="text"
                name="clientName"
                value={currentProject.clientName || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={currentProject.description || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
              <input
                type="email"
                name="clientEmail"
                value={currentProject.clientEmail || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={currentProject.dueDate instanceof Date 
                  ? currentProject.dueDate.toISOString().split('T')[0]
                  : typeof currentProject.dueDate === 'string'
                    ? new Date(currentProject.dueDate).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0]
                }
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Cost ($)</label>
              <input
                type="number"
                name="clientCost"
                value={currentProject.clientCost || 0}
                onChange={handleInputChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointments Needed</label>
              <input
                type="number"
                name="appointmentsNeeded"
                value={currentProject.appointmentsNeeded || 0}
                onChange={handleInputChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Needed</label>
            <input
              type="text"
              name="inventoryNeeded"
              value={currentProject.inventoryNeeded || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Measurements</label>
            <textarea
              name="measurements"
              value={currentProject.measurements || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={currentProject.notes || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => isCreate ? setShowCreateForm(false) : setShowEditForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              {isCreate ? 'Create Project' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Delete confirmation dialog
  const DeleteConfirmationDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4 text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-bold">Delete Project</h2>
          </div>
          
          <p className="mb-4">Are you sure you want to delete this project? This action cannot be undone.</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
  
  // Show error message if there was an error loading projects
  if (error) {
    return (
      <PageLayout title="Projects - Error">
        <div className="p-6 flex-1">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            <AlertTriangle className="h-6 w-6 inline-block mr-2" />
            {error}
          </div>
          <button 
            onClick={reloadProjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </PageLayout>
    );
  }
  
  // If projectId is provided, show the project detail view
  if (projectId) {
    console.log("Rendering project details for:", projectId);
    
    // Validate UUID format
    if (!isValidUUID(projectId)) {
      return (
        <PageLayout title="Invalid Project ID">
          <div className="p-6 flex-1">
            <Link to="/app/projects" className="flex items-center text-blue-500 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Projects
            </Link>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              <p className="font-medium">Invalid Project ID Format</p>
              <p className="mt-1">The project ID "{projectId}" is not in a valid format.</p>
            </div>
            
            {/* Add debug info in development mode */}
            {import.meta.env.DEV && (
              <DebugInfo 
                title="Debug Route Info" 
                data={{ projectId, isValidUUID: isValidUUID(projectId), projectsCount: projects.length }}
              />
            )}
          </div>
        </PageLayout>
      );
    }
    
    const project = projects.find(p => p.id === projectId);
    
    if (isLoading) {
      return (
        <PageLayout title="Project Details">
          <div className="p-6 flex-1 flex justify-center items-center">
            <div className="text-center">
              <div className="animate-pulse">Loading project details...</div>
            </div>
          </div>
        </PageLayout>
      )
    }
    
    if (!project) {
      return (
        <PageLayout title="Project Not Found">
          <div className="p-6 flex-1">
            <Link to="/app/projects" className="flex items-center text-blue-500 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Projects
            </Link>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              <p className="font-medium">Project not found</p>
              <p className="mt-1">The project with ID "{projectId}" could not be found. It may have been deleted or you might not have access.</p>
            </div>
            
            {/* Add debug info in development mode */}
            {import.meta.env.DEV && (
              <DebugInfo 
                title="Debug Project Data" 
                data={{ 
                  projectId, 
                  projectsCount: projects.length, 
                  projectIds: projects.map(p => p.id)
                }}
              />
            )}
          </div>
        </PageLayout>
      )
    }
    
    // Project exists, render the detail view
    try {
      return (
        <PageLayout title={project.name || "Project Details"}>
          <div className="flex-1 flex flex-col">
            <div className="p-3">
              <Link to="/app/projects" className="flex items-center text-blue-500 mb-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Projects
              </Link>
              
              <div className="flex justify-end space-x-2 mb-2">
                <button 
                  onClick={() => setShowEditForm(true)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 flex items-center text-sm"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 flex items-center text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </button>
              </div>
            </div>
            
            <div className="bg-white shadow-sm border-t border-b border-gray-200 overflow-hidden flex-1">
              {/* Project Header */}
              <div className="border-b p-4">
                <h2 className="text-lg font-bold text-gray-900">{project?.name || "Untitled Project"}</h2>
                <p className="text-gray-600 mt-1 text-sm">{project?.description || "No description"}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Client</p>
                      <p className="text-sm">{project?.clientName || "No client"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="text-sm">
                        {project?.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : "No date"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Appointments</p>
                      <p className="text-sm">{project?.appointmentsNeeded || 0} needed</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Measurements & Inventory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b">
                {project?.measurements && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1 text-sm">Measurements</h3>
                    <p className="text-gray-700 text-xs whitespace-pre-line">{project.measurements}</p>
                  </div>
                )}
                
                {project?.inventoryNeeded && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1 text-sm">Inventory Needed</h3>
                    <p className="text-gray-700 text-xs whitespace-pre-line">{project.inventoryNeeded}</p>
                  </div>
                )}
              </div>
              
              {/* Appointments */}
              {project?.appointments && Array.isArray(project.appointments) && project.appointments.length > 0 && (
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">Appointments</h3>
                    <Link 
                      to="/app/calendar" 
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View in Calendar
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {project.appointments.map((appointment) => {
                      try {
                        // Safely handle potential undefined properties
                        if (!appointment || typeof appointment !== 'object') {
                          console.error("Invalid appointment object:", appointment);
                          return null;
                        }
                        
                        // Ensure required properties exist
                        if (!appointment.id) {
                          console.error("Appointment missing ID:", appointment);
                          return null;
                        }
                        
                        // Cast to our enhanced type for proper type checking
                        const enhancedAppointment = appointment as EnhancedEvent;
                        
                        // Enhanced date handling - check for multiple possible date properties
                        // This handles both traditional calendar events and chat-created appointments
                        const getAppointmentDate = (appt: EnhancedEvent) => {
                          // Log the appointment to debug
                          console.debug("Processing appointment:", appt);
                          
                          if (appt.start) return new Date(appt.start);
                          if (appt.date) return new Date(appt.date);
                          if (appt.data?.date) return new Date(appt.data.date);
                          if (appt.data?.eventDate) return new Date(appt.data.eventDate);
                          
                          // If no date is found, log an error and return today's date
                          console.error("No valid date found in appointment:", appt);
                          return new Date();
                        };
                        
                        const startDate = getAppointmentDate(enhancedAppointment);
                        const endDate = enhancedAppointment.end 
                          ? new Date(enhancedAppointment.end) 
                          : enhancedAppointment.duration 
                            ? new Date(startDate.getTime() + (enhancedAppointment.duration * 60000))
                            : enhancedAppointment.data?.duration
                              ? new Date(startDate.getTime() + (enhancedAppointment.data.duration * 60000))
                              : new Date(startDate.getTime() + 30 * 60000);
                        
                        return (
                          <div 
                            key={enhancedAppointment.id} 
                            className="flex items-start p-2 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleAppointmentClick(enhancedAppointment)}
                          >
                            <div className="flex-shrink-0 bg-blue-100 rounded-md p-0 mr-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium text-gray-900 text-sm">{format(startDate, 'EEEE, MMMM d, yyyy')}</h4>
                                <div className="flex items-center text-gray-600 text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{format(startDate, 'h:mm a')}</span>
                                </div>
                              </div>
                              <p className="text-gray-700 mt-0.5 text-xs">{enhancedAppointment.description || enhancedAppointment.data?.description || "No description"}</p>
                              <div className="mt-1 flex justify-between text-xs">
                                <span className="text-gray-500">Tailor: {enhancedAppointment.employee || enhancedAppointment.data?.employee || "Not assigned"}</span>
                                <span className="text-gray-500">
                                  Duration: {Math.round((endDate.getTime() - startDate.getTime()) / 60000) || 0} min
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.error("Error rendering appointment:", error, appointment);
                        return null; // Skip rendering this appointment if there's an error
                      }
                    })}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              {project?.actions && Array.isArray(project.actions) && project.actions.length > 0 && (
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">Assistant Actions</h3>
                  <div className="space-y-2">
                    {project.actions.map(action => 
                      action && action.id ? (
                        <div key={action.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{action.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              action.state === 0 ? 'bg-gray-100 text-gray-800' : 
                              action.state === 1 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {ActionStateShim[action.state]}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-1 text-sm">{action.description}</p>
                          {action.type == 2 && <Link target="_blank" to={action.meta?.urlLink} className="text-green-700 mt-1 text-sm">See Cart Link</Link>}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Edit form modal */}
          {showEditForm && <ProjectForm isCreate={false} />}
          
          {/* Delete confirmation modal */}
          {showDeleteConfirm && <DeleteConfirmationDialog />}
          
          {/* Appointment detail dialog - now with viewInCalendar prop */}
          {selectedAppointment && project && (
            <>
              {/* Debug information */}
              {import.meta.env.DEV && (
                <div className="hidden">
                  {/* Debug info: Selected Appointment - see console for details */}
                  <pre>{JSON.stringify(selectedAppointment, null, 2)}</pre>
                </div>
              )}
              <EventViewDialog
                isOpen={isAppointmentDialogOpen}
                onClose={() => setIsAppointmentDialogOpen(false)}
                onEdit={handleEditAppointment}
                onDelete={handleDeleteAppointment}
                onViewInCalendar={handleViewInCalendar}
                event={{
                  id: selectedAppointment.id,
                  title: `Appointment for ${project.name}`,
                  description: selectedAppointment.description || '',
                  start: (() => { 
                    // Convert date to a proper Date object, handling various formats
                    // This ensures we don't have issues with string dates or invalid dates
                    let date: Date;
                    
                    try {
                      // If it's already a Date object, use it
                      if (selectedAppointment.date instanceof Date) {
                        date = selectedAppointment.date;
                      } else {
                        // Try to parse the string date
                        date = new Date(selectedAppointment.date);
                        
                        // Check if the date is valid
                        if (isNaN(date.getTime())) {
                          console.error("Invalid date detected:", selectedAppointment.date);
                          date = new Date(); // Fallback to current date if invalid
                        }
                      }
                    } catch (error) {
                      console.error("Error parsing date:", error);
                      date = new Date(); // Fallback to current date if error
                    }
                    
                    console.debug("EventViewDialog date conversion:", {
                      originalDate: selectedAppointment.date,
                      convertedDate: date,
                      isoString: date.toISOString(),
                      localeDateString: date.toLocaleDateString()
                    });
                    
                    return date;
                  })(),
                  end: (() => {
                    // Similar safe conversion for end date
                    let startDate: Date;
                    
                    try {
                      if (selectedAppointment.date instanceof Date) {
                        startDate = selectedAppointment.date;
                      } else {
                        startDate = new Date(selectedAppointment.date);
                        if (isNaN(startDate.getTime())) {
                          startDate = new Date();
                        }
                      }
                    } catch (error) {
                      startDate = new Date();
                    }
                    
                    return new Date(startDate.getTime() + (selectedAppointment.duration || 30) * 60000);
                  })(),
                  calendarId: 'appointments',
                  state: 'busy',
                  location: selectedAppointment.location || '',
                  employee: selectedAppointment.tailor || '',
                  client: { name: project.clientName },
                  notes: selectedAppointment.notes || ''
                }}
              />
            </>
          )}
        </PageLayout>
      )
    } catch (err) {
      console.error("Error rendering project details:", err);
      return (
        <PageLayout title="Error">
          <div className="p-6 flex-1">
            <Link to="/app/projects" className="flex items-center text-blue-500 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Projects
            </Link>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              <AlertTriangle className="h-6 w-6 inline-block mr-2" />
              An error occurred while rendering project details. Please try again.
            </div>
          </div>
        </PageLayout>
      );
    }
  }
  
  // Otherwise, show the projects list view
  return (
    <PageLayout title="Projects">
      <div className="p-2 md:p-4 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold">All Projects</h2>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Project
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-sm">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <h3 className="text-gray-600 font-medium text-sm">No projects found</h3>
            <p className="text-gray-500 mt-1 text-xs">Create your first project to get started</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto text-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map(project => (
              <Link key={project.id} to={`/app/projects/${project.id}`} className="block">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-3 border-b">
                    <h2 className="font-bold text-gray-900 text-base truncate">{project.name}</h2>
                    <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{project.description}</p>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-600">Client</span>
                      <span className="text-sm text-gray-900">{project.clientName}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-600">Due Date</span>
                      <span className="text-sm text-gray-900">{format(new Date(project.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Appointments</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-1">
                          {project.appointments?.length || 0}
                        </span>
                        <span className="text-xs text-gray-500">/ {project.appointmentsNeeded}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* Create project form modal */}
        {showCreateForm && <ProjectForm isCreate={true} />}
      </div>
    </PageLayout>
  )
}

export { ProjectsWrapper };
export default Projects 