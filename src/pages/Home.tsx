import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { Check, X, ChevronDown, ChevronUp, Maximize2, FolderKanban } from 'lucide-react';
import { format, compareDesc } from 'date-fns';
import useProjectServerStore from '../stores/projectServerStore';
import useActionStore from '../stores/actionStore';
import { Action, ActionPriority, ActionPriorityShim, ActionState, Project } from '../types';
import { Link } from 'react-router-dom';

// Define Action type for better type safety

const Home: React.FC = () => {
  // Get projects from the store
  const { projects, isLoading, fetchProjects } = useProjectServerStore();
  const { actions, runAction, deleteAction } = useActionStore()
  
  // Modified state for today's projects with progress added
  const [todaysProjects, setTodaysProjects] = useState<Array<Project>>([]);
  
  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  // Calculate today's projects whenever projects change
  useEffect(() => {
    if (projects.length > 0) {
      // Show all projects with randomly generated progress values
      const sorted = projects.sort((a, b) => compareDesc(b.dueDate, a.dueDate))
      setTodaysProjects(sorted);
    }
  }, [projects]);

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    projects: false,
    actions: false
  });

  // Function to determine how many actions to display based on expanded state
  const getVisibleActions = () => {
    if (expandedSections.actions) {
      return actions; // Show all actions when expanded
    } else if (actions.length <= 3) {
      return actions; // Show all if there are 3 or fewer
    } else {
      return actions.slice(0, 3); // Show first 3 (with the 3rd one partially visible) when not expanded
    }
  };

  // Handle approve/complete button
  const handleApproveAction = async (id: string) => {
    await runAction(id)
    
    // Remove the completed action after a brief delay to show the completed state
    setTimeout(async() => {
      // await deleteAction(id);
    }, 1000 * 60);
  };

  // Handle dismiss/cancel button
  const handleDismissAction = async (id: string) => {
    await deleteAction(id);
  };

  // Toggle section expanded state
  const toggleSectionExpand = (section: 'projects' | 'actions') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calendar data
  const currentMonth = new Date();
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Mock data for highlights in calendar
  const highlightedDays: Record<number, string> = {
    14: 'current', // Current day
    17: 'event',   // Day with event
    20: 'range-start', // Range start
    21: 'range-middle', // Range middle
    22: 'range-end', // Range end
    25: 'special'    // Special day
  };
  
  // Mock data for staff capacity
  const staffMembers = Array(7).fill('Dara');
  const staffAvailability = [
    [false, false, false, true, false, false, true],  // Row 1
    [false, true, false, true, false, false, true],   // Row 2 
    [false, true, false, true, false, false, true],   // Row 3
    [true, true, false, true, true, false, true]     // Row 4
  ];

  // Get visible projects based on expanded state
  const getVisibleProjects = () => {
    if (expandedSections.projects) {
      return todaysProjects; // Show all projects when expanded
    } else if (todaysProjects.length <= 2) {
      return todaysProjects; // Show all if there are 2 or fewer
    } else {
      return todaysProjects.slice(0, 2); // Show first 2 when not expanded
    }
  };

  return (
    <PageLayout title="Dashboard">
      <div className="px-4 sm:px-0 mx-auto w-full max-w-full">
        {/* Greeting */}
        <div className="p-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hello, Darren!</h1>
          <p className="text-sm sm:text-base text-gray-600">Welcome to your TailorMade dashboard</p>
        </div>
        
        {/* Main grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Today's Projects */}
            <section>
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <h2 className="text-base sm:text-lg font-medium">Current Projects</h2>
                  <Link 
                    to="/app/projects" 
                    className="text-xs text-blue-500 ml-2 hover:text-blue-700 flex items-center"
                  >
                    <FolderKanban className="h-3.5 w-3.5 mr-1" />
                    All Projects
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => fetchProjects()}
                    title="Refresh projects"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => toggleSectionExpand('projects')}
                    className="text-xs sm:text-sm text-blue-600"
                  >
                    {expandedSections.projects ? "Collapse" : "View All"}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 relative">
                {isLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-xs sm:text-sm text-gray-600">Loading projects...</span>
                  </div>
                ) : todaysProjects.length > 0 ? (
                  <div 
                    className="space-y-4 relative overflow-hidden" 
                    style={{ 
                      maxHeight: !expandedSections.projects && todaysProjects.length > 2 
                        ? 'calc(2 * 100px + 16px)' // Height for 2 projects
                        : '2000px', // Use a very large value instead of 'auto' for smoother animation
                      transition: 'max-height 0.3s ease-in-out'
                    }}
                  >
                    {getVisibleProjects().map(project => (
                      <Link 
                        to={`/app/projects/${project.id}`} 
                        key={project.id} 
                        className="block pb-3 hover:bg-gray-50 px-2 py-1 rounded-md -mx-1 sm:-mx-2 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-medium text-sm sm:text-base">{project.name}</span>
                            <div className="text-xs text-gray-500">Due - <span className='font-bold'>{format(project.dueDate, 'EEEE, MMMM do, yyyy')}</span></div>
                            <div className="text-xs text-gray-500">Description - <span className='font-bold'>{project.description}</span></div>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2.5">
                          <div 
                            className="bg-blue-300 h-2.5 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs sm:text-sm text-gray-600">
                    No projects due in the next week.
                  </div>
                )}
                
                {/* Shadow overlay for projects when not expanded */}
                {todaysProjects.length > 2 && !expandedSections.projects && (
                  <div 
                    className="absolute bottom-12 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"
                  ></div>
                )}
                
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={() => toggleSectionExpand('projects')}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={expandedSections.projects ? "Collapse projects" : "Expand projects"}
                  >
                    {expandedSections.projects ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-base sm:text-lg font-medium">Assistant Actions</h2>
                <button 
                  onClick={() => toggleSectionExpand('actions')}
                  className="text-xs sm:text-sm text-blue-600"
                >
                  {expandedSections.actions ? "Collapse" : "View All"}
                </button>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 relative">
                <div 
                  className="divide-y overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: !expandedSections.actions && actions.length > 3 
                      ? '266px' // Height for 3 items
                      : '2000px' // Effectively unlimited
                  }}
                >
                  {getVisibleActions().sort((a: Action, b: Action) => b.priority - a.priority).map((action, index) => (
                    <div 
                      key={action.id} 
                      className={`flex items-center justify-between pb-4 ${
                        index > 0 ? 'pt-4' : 'pt-0'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center text-white">
                          {action.name.substring(0, 1)}
                        </div>
                        <div>
                          {/* For the third item when we have more than 3, just show the person's name */}
                          {index === 2 && actions.length > 3 && !expandedSections.actions ? (
                            <>
                              <div className="font-medium">{action.name}</div>
                              <div className="text-sm">{action.description}</div>
                              <div className="text-sm text-gray-500">
                                {action.state == ActionState.Done ? (
                                  <>
                                    <div className="text-xs sm:text-sm text-gray-500 line-through">
                                      {action.name}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Completed
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-xs text-gray-500">
                                      Priority: {ActionPriorityShim[action.priority]}
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">
                                {action.name}
                              </div>
                              <div className="text-sm">
                                {action.description}
                              </div>
                              <div className="text-sm text-gray-500">
                                {action.state == ActionState.Done ? (
                                  <>
                                    <div className="text-xs sm:text-sm text-gray-500 line-through">
                                      {action.name}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Completed
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-xs text-gray-500">
                                      Priority: {ActionPriorityShim[action.priority]}
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={() => handleDismissAction(action.id)}
                          aria-label="Dismiss action"
                        >
                          <X size={18} />
                        </button>
                        <button 
                          className="text-green-500 hover:text-green-700 transition-colors"
                          onClick={() => handleApproveAction(action.id)}
                          aria-label="Approve action"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Shadow overlay to indicate more content - only shown when there are more than 3 actions and section is not expanded */}
                {actions.length > 3 && !expandedSections.actions && (
                  <div className="h-12 bg-gradient-to-t from-white to-transparent absolute bottom-0 left-0 right-0 pointer-events-none"></div>
                )}
              </div>
              
              {/* Expand button at bottom */}
              {actions.length > 3 && (
                <button 
                  onClick={() => toggleSectionExpand('actions')}
                  className="w-full mt-2 p-1 text-xs sm:text-sm text-center text-blue-600 hover:text-blue-800 md:hidden flex items-center justify-center"
                  aria-label={expandedSections.actions ? "Collapse actions" : "Expand actions"}
                >
                  {expandedSections.actions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              )}
            </section>
          </div>
          
          {/* Right column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Calendar */}
            <section>
              <h2 className="text-base sm:text-lg font-medium mb-2">Calendar {format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={day + i} className="text-xs sm:text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {/* Empty cells for days before the first of the month */}
                  {Array(5).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} className="h-6 sm:h-8 flex items-center justify-center"></div>
                  ))}
                  
                  {/* Days of the month */}
                  {days.map(day => {
                    const dayType = highlightedDays[day];
                    let className = "h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full text-xs sm:text-sm";
                    
                    if (dayType === 'current') {
                      className += " bg-black text-white";
                    } else if (dayType === 'event') {
                      className += " bg-green-100 text-green-800";
                    } else if (dayType === 'range-start') {
                      className += " bg-blue-200 text-blue-800";
                    } else if (dayType === 'range-middle') {
                      className += " bg-blue-200 text-blue-800";
                    } else if (dayType === 'range-end') {
                      className += " bg-blue-200 text-blue-800";
                    } else if (dayType === 'special') {
                      className += " bg-pink-200 text-pink-800";
                    }
                    
                    return (
                      <div key={day} className="flex items-center justify-center">
                        <div className={className}>{day}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            
            {/* Staff Capacity */}
            <section>
              <h2 className="text-base sm:text-lg font-medium mb-2">Staff Capacity</h2>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {staffAvailability.map((row, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                      {row.map((isAvailable, colIndex) => (
                        <div 
                          key={`cell-${rowIndex}-${colIndex}`}
                          className={`flex items-center justify-center`}
                        >
                          <div 
                            className={`w-6 h-6 rounded-full ${isAvailable ? 'bg-gray-600' : 'border border-gray-300'}`}
                          ></div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {staffMembers.map((name, index) => (
                    <div key={`name-${index}`} className="text-center text-xs">
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            {/* Quick Links */}
            <section>
              <h2 className="text-base sm:text-lg font-medium mb-2">Quick Links</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                <button className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-3 sm:p-4 rounded-lg shadow-sm transition-colors">
                  <div className="text-center">
                    <Maximize2 className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1" />
                    <span className="text-xs sm:text-sm">New Appointment</span>
                  </div>
                </button>
                <button className="bg-purple-50 hover:bg-purple-100 text-purple-600 p-3 sm:p-4 rounded-lg shadow-sm transition-colors">
                  <div className="text-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
                    </svg>
                    <span className="text-xs sm:text-sm">New Client</span>
                  </div>
                </button>
                <button className="bg-green-50 hover:bg-green-100 text-green-600 p-3 sm:p-4 rounded-lg shadow-sm transition-colors">
                  <div className="text-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    <span className="text-xs sm:text-sm">New Project</span>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Home; 