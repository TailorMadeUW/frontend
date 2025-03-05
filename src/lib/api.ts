/**
 * Simple API service for TailorMade backend
 * Based on Swagger documentation at:
 * https://tailormadeserver-dbhmbqg0b9eda3dd.westus2-01.azurewebsites.net/swagger/index.html
 */

// API base URL - use proxy in development
const API_BASE_URL = import.meta.env.PROD
  ? 'https://tailormadeserver-dbhmbqg0b9eda3dd.westus2-01.azurewebsites.net'
  : '/api';

/**
 * Note API endpoints
 */
export const noteApi = {
  // Upload a note image for analysis
  upload: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/agent/upload`, {
        method: 'POST',
        body: formData,
        // Allow credentials for CORS
        credentials: 'include'
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
        credentials: 'include'
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
        credentials: 'include'
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
        credentials: 'include'
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

export default {
  note: noteApi,
  calendar: calendarApi
}; 