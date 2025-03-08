import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Action, ActionState } from '../types'
import { actionsApi } from '../lib/api'

interface ActionStore {
  // State
  actions: Action[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchActions: () => Promise<void>
  runAction: (action: Action) => Promise<Action | null>
  updateActionState: (actionId: number, newState: ActionState) => void
  filterActionsByState: (state: ActionState) => Action[]
  filterActionsByConfirmed: (confirmed: boolean) => Action[]
}

export const useActionStore = create<ActionStore>()(
  devtools(
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
      runAction: async (action: Action) => {
        set({ isLoading: true, error: null })
        
        try {
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

      // Update action state (optimistic update)
      updateActionState: (actionId: number, newState: ActionState) => {
        set((state) => ({
          actions: state.actions.map(action => 
            action.id === actionId 
              ? { ...action, state: newState } 
              : action
          )
        }))
      },

      // Filter actions by state
      filterActionsByState: (state: ActionState) => {
        return get().actions.filter(action => action.state === state)
      },

      // Filter actions by confirmed status
      filterActionsByConfirmed: (confirmed: boolean) => {
        return get().actions.filter(action => action.confirmed === confirmed)
      }
    }),
    { name: 'action-store' }
  )
)

export default useActionStore
