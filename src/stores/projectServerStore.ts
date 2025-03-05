import { create } from 'zustand'
import { Project } from '../types'
import { projectApi } from '../lib/api'

interface ProjectState {
    projects: Project[]
    isLoading: boolean
    fetchProjects: () => Promise<void>
    getAll: () => Promise<Project[]>
    get: (id: string) => Promise<Project | undefined>
    create: (project: Project) => Promise<void>
    update: (project: Project) => Promise<void>
    remove: (id: string) => Promise<void>
}

const useProjectServerStore = create<ProjectState>((set, get) => ({
    projects: [],
    isLoading: false,

    fetchProjects: async () => {
        set({ isLoading: true })
        try {
            const result = await projectApi.getAll()
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to fetch projects')
            }
            console.log("loaded projects:", result.data)
            set({ projects: result.data })
        } catch (error) {
            console.error('Failed to fetch projects:', error)
            throw error
        } finally {
            set({ isLoading: false })
        }
    },
    
    getAll: async () => {
        await get().fetchProjects()
        return get().projects
    },

    get: async (id: string) => {
        const result = await projectApi.get(id)
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch project')
        }
        // Update the project in the list if it exists
        set(state => ({
            projects: state.projects.map(p => 
                p.id === id ? result.data : p
            )
        }))
        return result.data
    },

    create: async (project: Project) => {
        const result = await projectApi.create(project)
        if (!result.success) {
            throw new Error(result.error || 'Failed to create project')
        }
        // Refresh all projects instead of updating state directly
        await get().fetchProjects()
    },

    update: async (project: Project) => {
        const result = await projectApi.update(project.id, project)
        if (!result.success) {
            throw new Error(result.error || 'Failed to update project')
        }
        // Refresh all projects instead of updating state directly
        await get().fetchProjects()
    },

    remove: async (id: string) => {
        const result = await projectApi.delete(id)
        if (!result.success) {
            throw new Error(result.error || 'Failed to delete project')
        }
        // Refresh all projects instead of updating state directly
        await get().fetchProjects()
    }
}))


export default useProjectServerStore