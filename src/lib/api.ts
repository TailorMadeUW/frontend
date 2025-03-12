/**
 * Simple API service for TailorMade backend
 * Based on Swagger documentation at:
 * https://tailormadeserver-dbhmbqg0b9eda3dd.westus2-01.azurewebsites.net/swagger/index.html
 */

// API base URL - use proxy in development
const API_BASE_URL = 'https://tailormadeserver-dbhmbqg0b9eda3dd.westus2-01.azurewebsites.net';

/**
 * Note API endpoints
 */
export const noteApi = {
  // Upload a note image for analysis
  appointment: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/agent/appointment`, {
        method: 'POST',
        body: formData,
        // Allow credentials for CORS
        // credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Note upload failed:', error);
      
      // In development, provide mock data
      if (!import.meta.env.PROD) {
        console.log('Using mock data due to API error');
        
        // Randomize what type of data we return (appointment or project)
        const responseType = Math.random() > 0.5 ? 'appointment' : 'project';
        
        if (responseType === 'appointment') {
          return {
            success: true,
            data: {
              date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              clientName: "John Smith",
              tailor: "Maria Rodriguez",
              duration: 60,
              appointmentsNeeded: 2,
              inventoryNeeded: "Blue fabric (2 yards), Buttons (12)",
              notes: "Client requested slim fit suit with modern lapels. Previous measurements need updating due to recent weight change.",
              measurements: "Chest: 42\", Waist: 34\", Inseam: 32\""
            },
            error: null
          };
        } else {
          // Mock project data
          return {
            success: true,
            data: {
              type: 'project',
              project: {
                id: "acc56652-94d0-4deb-bf90-a2ec0d45a55f",
                name: "Emily Porter Wedding Dress Alteration Project",
                description: "This project covers alterations for Emily Porter's upcoming wedding dress. The work includes measurement confirmation, reinforcing the bodice structure, adjustment for detachable lace sleeves, review of lace swatches and fabric choices, demonstration of a sample bustle mechanism for the train fastening, and final tweaks such as hem confirmations. The client will decide between built-in corset support or alternative cup options during the process.",
                clientName: "Emily Porter",
                clientEmail: "emily.porter@example.com",
                clientCost: 800,
                appointmentsNeeded: 3,
                inventoryNeeded: "Ivory lace fabric, lace applique material, lace swatches, sample bustle mechanism kit",
                notes: null,
                measurements: "Bust: 35 inch, Waist: 27 inch, Hips: 38 inch, Hollow-to-hear: 59 inch",
                dueDate: "2026-05-23T00:00:00",
                appointments: [
                  {
                    id: "9be63359-48cd-4cf1-bd3c-ec4cbb35f644",
                    projectId: null,
                    date: "2025-03-10T08:00:00",
                    clientName: "Emily Porter",
                    tailor: "Darren",
                    duration: 60,
                    description: "Initial fitting to confirm measurements and discuss overall design elements, including fabric choices for lace and tulle components.",
                    notes: "Measurement confirmation and initial consultation to discuss design details, detachable sleeves, and fabric preferences.",
                    location: "Fitting Room 1"
                  },
                  {
                    id: "1481a44a-3894-45c1-9faf-dbd64f10afa0",
                    projectId: null,
                    date: "2025-03-30T10:00:00",
                    clientName: "Emily Porter",
                    tailor: "Sarah",
                    duration: 60,
                    description: "Second fitting to finalize the bodice design, evaluate fabric samples, and demonstrate bustle mechanism options.",
                    notes: "Review and finalize bodice reinforcement details; present lace swatches and sample bustle mechanism options.",
                    location: "Fitting Room 2"
                  },
                  {
                    id: "a580e518-9d7a-4917-b8b3-d6b05ca1e372",
                    projectId: null,
                    date: "2025-04-13T09:00:00",
                    clientName: "Emily Porter",
                    tailor: "Darren",
                    duration: 60,
                    description: "Third fitting for final adjustments, confirming the hem length and overall fit, and locking in design choices.",
                    notes: "Final tweaks including hem length confirmation and addressing any adjustments from client's diet changes.",
                    location: "Fitting Room 3"
                  }
                ],
                actions: [
                  {
                    id: "c1497bc0-0cb9-4408-966c-7f2f22a4673e",
                    name: "Order Ivory Lace Fabric",
                    description: "Order the required ivory lace fabric to replace the standard stock white option and to be used in the lace appliqués on the dress.",
                    type: 2,
                    priority: 2,
                    state: 0
                  },
                  {
                    id: "89d9d043-ea65-4f36-a563-ca762177460c",
                    name: "Order Lace Applique Material",
                    description: "Procure the appropriate lace applique material needed for the low V-back detailing and trim around the waistline.",
                    type: 2,
                    priority: 2,
                    state: 0
                  },
                  {
                    id: "730daa7d-5413-4606-80c4-d9ccd38f0c5d",
                    name: "Order Lace Swatches",
                    description: "Obtain samples of lace swatches to finalize the detachable cup sleeve fabric choice during the next fitting.",
                    type: 2,
                    priority: 2,
                    state: 0
                  },
                  {
                    id: "869e2042-2f7a-49b9-adfe-2f2d929bc000",
                    name: "Order Sample Bustle Mechanism Kit",
                    description: "Purchase a sample kit for a simple bustle mechanism so that the maid of honor can easily fasten the train, as requested.",
                    type: 2,
                    priority: 2,
                    state: 0
                  }
                ]
              }
            },
            error: null
          };
        }
      }
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  project: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/agent/project`, {
        method: 'POST',
        body: formData,
        // Allow credentials for CORS
        // credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Note upload failed:', error);
      
      // In development, provide mock data
      if (!import.meta.env.PROD) {
        console.log('Using mock data due to API error');
        return {
          success: true,
          data: [
            {
              name: "Natalia's Bridal Alterations",
              description: "Alterations required for bridal dress as per client's request.",
              clientName: "Natalia",
              clientCost: 0,
              dueDate: "2025-06-12",
              appointments: [
                {
                  clientName: "Natalia",
                  date: "2025-03-07T16:30:00",
                  duration: 90,
                  tailor: "Daylon",
                  appointmentsNeeded: 3,
                  inventoryNeeded: "Bridal accessories for fitting",
                  measurements: "Standard bridal measurements",
                  notes: "First fitting session to evaluate overall fit and adjustments needed based on the initial estimates.",
                  description: "Initial fitting appointment for bridal dress alterations based on initial notes and evaluations.",
                  location: "Fitting room 1"
                },
                {
                  clientName: "Natalia",
                  date: "2025-04-10T14:00:00",
                  duration: 60,
                  tailor: "Daylon",
                  appointmentsNeeded: 2,
                  inventoryNeeded: "Altered bridal dress, new fabric if needed",
                  measurements: "To confirm and modify as needed during fitting",
                  notes: "Follow-up fitting to assess adjustments made after first fitting, possible adjustments based on client feedback.",
                  description: "Follow-up fitting appointment to check on alterations made and any new required changes for the bridal dress.",
                  location: "Fitting room 2"
                },
                {
                  clientName: "Natalia",
                  date: "2025-05-15T15:00:00",
                  duration: 75,
                  tailor: "Daylon",
                  appointmentsNeeded: 1,
                  inventoryNeeded: "Finalized bridal dress",
                  measurements: "Final measurement check before wedding day",
                  notes: "Final fitting to ensure all alterations are completed and the dress fits perfectly before the wedding.",
                  description: "Final fitting session for bridal dress to confirm all adjustments are satisfactory and ready for the wedding day.",
                  location: "Fitting room 3"
                }
              ]
            }
          ],
          error: null
        };
      }
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Calendar API endpoints 
 * (Would be implemented based on Swagger docs)
 */
export const calendarApi = {
  // Get a list of events
  getAppointments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar`, {
        method: 'GET',
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json()
      console.log("Full calendar:", data)

      return {
        success: true,
        data: data,
        error: null
      };
    } catch (error) {
      console.error('Calendar fetch failed:', error);

      // In development, provide mock data
      if (!import.meta.env.PROD) {
        console.log('Using mock data due to API error');
        return {
          success: true,
          data: [
            {
              id: '1',
              date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              clientName: 'John Smith',
              duration: 60,
              type: 'Fitting'
            }
          ],
          error: null
        };
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  addAppointment: async (appointmentData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Add appointment failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  updateAppointment: async (id: string, appointmentData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/appointment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Update appointment failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  deleteAppointment: async(id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/appointment/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('Update appointment failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export const projectApi = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/project`, {
        method: 'GET',
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Project fetch failed:', error);

      // In development, provide mock data
      if (!import.meta.env.PROD) {
        console.log('Using mock data due to API error');
        return {
          success: true,
          data: [
            {
              id: '1',
              clientName: 'John Smith',
              description: 'Three-piece suit',
              status: 'In Progress',
              startDate: new Date(Date.now()).toISOString(),
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              measurements: {
                chest: 42,
                waist: 34,
                inseam: 32
              }
            }
          ],
          error: null
        };
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  get: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/project/${id}`, {
        method: 'GET',
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Project fetch failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  create: async (projectData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Create project failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  update: async (id: string, projectData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/project/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Update project failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  delete: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/project/${id}`, {
        method: 'DELETE',
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('Delete project failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export const actionsApi = {
  // Get all actions
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/action`, {
        method: 'GET',
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Actions fetch failed:', error);

      // In development, provide mock data
      if (!import.meta.env.PROD) {
        console.log('Using mock data due to API error');
        return {
          success: true,
          data: [
            {
              id: 1,
              name: 'Email client about appointment',
              priority: 'Medium',
              type: 'SendConfirmationEmail',
              state: 'Todo',
              confirmed: false
            },
            {
              id: 2,
              name: 'Order blue fabric',
              priority: 'High',
              type: 'OrderInventory',
              state: 'InProgress',
              confirmed: true
            }
          ],
          error: null
        };
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Run an action
  runAction: async (id: string, action: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/action/run/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        data: await response.json(),
        error: null
      };
    } catch (error) {
      console.error('Run action failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  // Delete an action
  delete: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/action/${id}`, {
        method: 'DELETE',
        // credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('Delete action failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default {
  note: noteApi,
  calendar: calendarApi,
  projectApi: projectApi,
  actionsApi: actionsApi,
}; 