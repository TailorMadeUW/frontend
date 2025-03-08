import { create } from 'zustand'
import { Action } from '../types'
import { actionsApi } from '../lib/api'

interface ActionStore {
  // State
  actions: Action[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchActions: () => Promise<void>
  runAction: (id: string) => Promise<Action | null>
  deleteAction: (actionId: string) => Promise<boolean>
}

export const useActionStore = create<ActionStore>()(
    (set, get) => ({
      // Initial state
      actions: [],
      isLoading: false,
      error: null,

      // Fetch all actions from the API
      fetchActions: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await actionsApi.getAll()
          
          if (response.success && response.data) {
            set({ actions: response.data, isLoading: false })
          } else {
            set({ 
              error: response.error || 'Failed to fetch actions', 
              isLoading: false 
            })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred', 
            isLoading: false 
          })
        }
      },

      // Run an action using the API
      runAction: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
            
          const action: Action = get().actions.find(a => a.id === id);
          if (!action) return
          
          const response = await actionsApi.runAction(action.id, action)
          
          if (response.success && response.data) {
            // Update the action in the store
            set((state) => ({
              actions: state.actions.map(a => 
                a.id === response.data.id ? response.data : a
              ),
              isLoading: false
            }))
            return response.data
          } else {
            set({ 
              error: response.error || 'Failed to run action', 
              isLoading: false 
            })
            return null
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred', 
            isLoading: false 
          })
          return null
        }
      },

      // Delete an action and refresh the actions list
      deleteAction: async (actionId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await actionsApi.delete(actionId)
          
          if (response.success) {
            // Remove the action from the store and refresh
            set((state) => ({
              actions: state.actions.filter(a => a.id !== actionId),
              isLoading: false
            }))
            // Refresh the actions list to ensure consistency with the server
            await get().fetchActions()
            return true
          } else {
            set({ 
              error: response.error || 'Failed to delete action', 
              isLoading: false 
            })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred', 
            isLoading: false 
          })
          return false
        }
      },
    })
)

export default useActionStore
