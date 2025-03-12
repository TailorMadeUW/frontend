import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Project, ActionState, Event, ActionStateShim } from '../types'
import useProjectServerStore from '../stores/projectServerStore'
import { format, isPast } from 'date-fns'
import { Calendar, Clock, Users, FileText, ArrowLeft, Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'
import EventViewDialog from '../components/Calendar/EventViewDialog'

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

const Projects: React.FC = () => {
  const { projects, fetchProjects, create, update, remove } = useProjectServerStore()
  const [isLoading, setIsLoading] = useState(true)
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
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchProjects()
      setIsLoading(false)
    }
    
    loadData()
  }, [fetchProjects])

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
  const handleAppointmentClick = (appointment: any) => {
    // Type assertion to match our Appointment interface
    setSelectedAppointment(appointment as Appointment)
    setIsAppointmentDialogOpen(true)
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
  
  // If projectId is provided, show the project detail view
  if (projectId) {
    const project = projects.find(p => p.id === projectId)
    
    if (isLoading) {
      return <div className="flex justify-center items-center h-screen">Loading project details...</div>
    }
    
    if (!project) {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <Link to="/app/projects" className="flex items-center text-blue-500 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            Project not found. The project may have been deleted or you might not have access.
          </div>
        </div>
      )
    }
    
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-4 overflow-y-auto">
          <Link to="/app/projects" className="flex items-center text-blue-500">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowEditForm(true)}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 flex items-center"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto">
          {/* Project Header */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{project.clientName}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{format(new Date(project.dueDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Appointments</p>
                  <p className="font-medium">{project.appointmentsNeeded} needed</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Measurements & Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b">
            {project.measurements && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Measurements</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line">{project.measurements}</p>
              </div>
            )}
            
            {project.inventoryNeeded && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Inventory Needed</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line">{project.inventoryNeeded}</p>
              </div>
            )}
          </div>
          
          {/* Appointments */}
          {project.appointments && project.appointments.length > 0 && (
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">Appointments</h3>
                <Link 
                  to="/app/calendar" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View in Calendar
                </Link>
              </div>
              <div className="space-y-3">
                {project.appointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3 mr-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">{format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}</h4>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{format(new Date(appointment.date), 'h:mm a')}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-1">{appointment.description || "No description"}</p>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">Tailor: {appointment.tailor || "Not assigned"}</span>
                        <span className="text-gray-500">Duration: {appointment.duration || 0} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          {project.actions && project.actions.length > 0 && (
            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-3">Assistant Actions</h3>
              <div className="space-y-2">
                {project.actions.map(action => (
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
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit form modal */}
        {showEditForm && <ProjectForm isCreate={false} />}
        
        {/* Delete confirmation modal */}
        {showDeleteConfirm && <DeleteConfirmationDialog />}
        
        {/* Appointment detail dialog - now with viewInCalendar prop */}
        {selectedAppointment && project && (
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
              start: new Date(selectedAppointment.date),
              end: new Date(new Date(selectedAppointment.date).getTime() + (selectedAppointment.duration || 30) * 60000),
              calendarId: 'appointments',
              state: 'busy',
              location: selectedAppointment.location || '',
              employee: selectedAppointment.tailor || '',
              client: { name: project.clientName },
              notes: selectedAppointment.notes || ''
            }}
          />
        )}
      </div>
    )
  }
  
  // Otherwise, show the projects list view
  return (
    <div className="container max-w-6xl mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Project
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="text-gray-600 font-medium">No projects found</h3>
          <p className="text-gray-500 mt-2">Create your first project to get started</p>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link key={project.id} to={`/app/projects/${project.id}`} className="block">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto hover:shadow-md transition-shadow">
                <div className="p-5 border-b">
                  <h2 className="font-bold text-gray-900 text-lg truncate">{project.name}</h2>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{project.description}</p>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Client</span>
                    <span className="font-medium text-gray-900">{project.clientName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Due Date</span>
                    <span className="font-medium text-gray-900">{format(new Date(project.dueDate), 'MMM d, yyyy')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Appointments</span>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 mr-1">
                        {project.appointments?.filter(a => isPast(a.date)).length || 0}
                      </span>
                      <span className="text-xs text-gray-500">/ {project.appointments?.length}</span>
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
  )
}

export default Projects 