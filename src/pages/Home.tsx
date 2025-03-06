import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { Check, X, ChevronDown, ChevronUp, Calendar as CalendarIcon, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import useProjectServerStore from '../stores/projectServerStore';
import { Project } from '../types';

// Define Action type for better type safety
interface Action {
  id: number;
  type: 'reschedule' | 'send' | 'call' | 'email';
  person?: string;
  item?: string;
  date: Date;
  initials: string;
  completed?: boolean;
}

const Home: React.FC = () => {
  // Get projects from the store
  const { projects, isLoading, fetchProjects } = useProjectServerStore();
  
  // Modified state for today's projects with progress added
  const [todaysProjects, setTodaysProjects] = useState<Array<{ id: string; name: string; progress: number; clientName: string }>>([]);
  
  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  // Calculate today's projects whenever projects change
  useEffect(() => {
    if (projects.length > 0) {
      // Show all projects with randomly generated progress values
      const projectsWithProgress = projects
        .map(project => {
          // Generate a random progress value in increments of 5% (1/20th of 100)
          const randomProgress = Math.floor(Math.random() * 21) * 5; // 0, 5, 10, ..., 95, 100
          
          return {
            id: project.id,
            name: project.name,
            progress: randomProgress,
            clientName: project.clientName
          };
        });
      
      setTodaysProjects(projectsWithProgress);
    }
  }, [projects]);

  // Move mock data into state for interactivity
  const [actions, setActions] = useState<Action[]>([
    { 
      id: 1, 
      type: 'reschedule', 
      person: 'Ellie', 
      date: new Date(2024, 3, 25, 14, 0), // April 25, 2024, 2:00 PM
      initials: 'EK'
    },
    { 
      id: 2, 
      type: 'send', 
      item: 'AD', 
      date: new Date(2024, 3, 17, 14, 0), // April 17, 2024, 2:00 PM
      initials: 'RP'
    },
    { 
      id: 3, 
      type: 'reschedule', 
      person: 'Michael', 
      date: new Date(2024, 3, 20, 10, 0), // April 20, 2024, 10:00 AM
      initials: 'MS'
    },
    { 
      id: 4, 
      type: 'send', 
      item: 'Invoice', 
      date: new Date(2024, 3, 22, 13, 30), // April 22, 2024, 1:30 PM
      initials: 'JD'
    },
    { 
      id: 5, 
      type: 'reschedule', 
      person: 'Sarah', 
      date: new Date(2024, 3, 18, 15, 0), // April 18, 2024, 3:00 PM
      initials: 'SW'
    }
  ]);

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
  const handleApproveAction = (id: number) => {
    setActions(prevActions => 
      prevActions.map(action => 
        action.id === id 
          ? { ...action, completed: true } 
          : action
      )
    );
    
    // Remove the completed action after a brief delay to show the completed state
    setTimeout(() => {
      setActions(prevActions => prevActions.filter(action => action.id !== id));
    }, 500);
  };

  // Handle dismiss/cancel button
  const handleDismissAction = (id: number) => {
    setActions(prevActions => prevActions.filter(action => action.id !== id));
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
      <div className="flex-1 px-4 pb-6 space-y-6 overflow-y-auto h-full">
        
        {/* Today's Projects */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium">Current Projects</h2>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => fetchProjects()}
                className="text-gray-600 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50"
                disabled={isLoading}
                title="Refresh projects"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button 
                onClick={() => toggleSectionExpand('projects')}
                className="text-blue-600 text-sm"
              >
                {expandedSections.projects ? "Collapse" : "View All"}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 relative">
            {isLoading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading projects...</span>
              </div>
            ) : todaysProjects.length > 0 ? (
              <div 
                className="space-y-4 relative overflow-hidden" 
                style={{ 
                  maxHeight: !expandedSections.projects && todaysProjects.length > 2 
                    ? 'calc(2 * 50px + 16px)' // Height for 2 projects
                    : '2000px', // Use a very large value instead of 'auto' for smoother animation
                  transition: 'max-height 0.3s ease-in-out'
                }}
              >
                {getVisibleProjects().map(project => (
                  <div key={project.id} className="pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-medium">{project.name}</span>
                        <div className="text-xs text-gray-500">for {project.clientName}</div>
                      </div>
                      <span className="text-gray-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2.5">
                      <div 
                        className="bg-blue-300 h-2.5 rounded-full" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-600">
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
            <h2 className="text-lg font-medium">Actions</h2>
            <button 
              onClick={() => toggleSectionExpand('actions')}
              className="text-blue-600 text-sm"
            >
              {expandedSections.actions ? "Collapse" : "View All"}
            </button>
          </div>
          <div className="bg-white rounded-lg shadow p-4 relative">
            <div 
              className="space-y-4 relative overflow-hidden" 
              style={{ 
                maxHeight: !expandedSections.actions && actions.length > 3 
                  ? 'calc(2 * 84px + 32px)' // Height for 2 full items + part of 3rd item 
                  : '2000px', // Use a very large value instead of 'auto' for smoother animation
                transition: 'max-height 0.3s ease-in-out'
              }}
            >
              {getVisibleActions().map((action, index) => (
                <div 
                  key={action.id} 
                  className={`flex items-center justify-between pb-4 ${
                    action.completed ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center text-white">
                      {action.initials}
                    </div>
                    <div>
                      {/* For the third item when we have more than 3, just show the person's name */}
                      {index === 2 && actions.length > 3 && !expandedSections.actions ? (
                        <>
                          <div className="font-medium">{action.person}</div>
                          <div className="text-sm text-gray-500">
                            {format(action.date, 'd MMMM, yyyy')} | {format(action.date, 'HH:mm')}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium">
                            {action.type === 'reschedule' 
                              ? `Reschedule - ${action.person}` 
                              : `Send ${action.item}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(action.date, 'd MMMM, yyyy')} | {format(action.date, 'HH:mm')}
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
              <div 
                className="absolute bottom-12 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"
              ></div>
            )}
            
            <div className="flex justify-center mt-4">
              <button 
                onClick={() => toggleSectionExpand('actions')}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label={expandedSections.actions ? "Collapse actions" : "Expand actions"}
              >
                {expandedSections.actions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
        </section>
        
        {/* Calendar */}
        <section>
          <h2 className="text-lg font-medium mb-2">Calendar</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">April 2024</h3>
              <button className="text-gray-500">
                <Maximize2 size={18} />
              </button>
            </div>
            
            {/* Calendar header */}
            <div className="grid grid-cols-7 mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before the first of the month */}
              {Array(5).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="h-8 flex items-center justify-center"></div>
              ))}
              
              {/* Days of the month */}
              {days.map(day => {
                const dayType = highlightedDays[day];
                let className = "h-8 w-8 flex items-center justify-center rounded-full";
                
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
          <h2 className="text-lg font-medium mb-2">Staff Capacity</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-7 gap-2">
              {staffAvailability.map((row, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  {row.map((isAvailable, colIndex) => (
                    <div 
                      key={`cell-${rowIndex}-${colIndex}`}
                      className="flex items-center justify-center"
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
      </div>
    </PageLayout>
  );
};

export default Home; 