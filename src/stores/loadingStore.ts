import { create } from 'zustand'

interface LoadingState {
  isLoading: boolean
  resources: {
    calendar: boolean
    profile: boolean
    settings: boolean
  }
  setLoading: (isLoading: boolean) => void
  resourceLoaded: (resource: keyof LoadingState['resources']) => void
  initializeApp: () => Promise<void>
}

const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: true, // Start with loading as true
  resources: {
    calendar: false,
    profile: false,
    settings: false
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  resourceLoaded: (resource) => {
    set((state) => ({
      resources: {
        ...state.resources,
        [resource]: true
      }
    }))
    
    // Check if all resources are loaded and finish loading if they are
    const state = get()
    const allLoaded = Object.values(state.resources).every(loaded => loaded)
    
    if (allLoaded) {
      // Add a small delay to ensure animations complete
      setTimeout(() => {
        set({ isLoading: false })
      }, 300)
    }
  },
  
  initializeApp: async () => {
    try {
      // Simulate loading essential app data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Initial check for resources
      const { resources } = get()
      const allResourcesLoaded = Object.values(resources).every(loaded => loaded)
      
      // Only auto-complete loading after a timeout if no resources need loading
      if (allResourcesLoaded) {
        // Force completion after a safety timeout (5 seconds max)
        setTimeout(() => {
          set({ isLoading: false })
        }, 500)
      }
    } catch (error) {
      console.error('Error initializing app:', error)
      set({ isLoading: false }) // Ensure we don't block the UI if something fails
    }
  }
}))

export default useLoadingStore 