import React, { useEffect, useState } from 'react'
import useLoadingStore from '../stores/loadingStore'

interface LoadingScreenProps {
  isLoading: boolean
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const [shouldRender, setShouldRender] = useState(isLoading)
  const [fadeOut, setFadeOut] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const { resources } = useLoadingStore()
  
  // Handle mounting/unmounting of the component
  useEffect(() => {
    if (isLoading) {
      setShouldRender(true)
      setFadeOut(false)
    } else {
      // When loading completes, first show 100% for a moment
      if (progress < 100) {
        setProgress(100)
        setShowComplete(true)
        
        // Wait a moment at 100% before starting fade out
        const completeTimer = setTimeout(() => {
          setFadeOut(true)
          
          // Remove component after animation completes
          const unmountTimer = setTimeout(() => {
            setShouldRender(false)
          }, 500) // Match this with the CSS animation duration
          
          return () => clearTimeout(unmountTimer)
        }, 500) // Show 100% for 500ms
        
        return () => clearTimeout(completeTimer)
      } else {
        // If already at 100%, just fade out
        setFadeOut(true)
        
        // Remove component after animation completes
        const timer = setTimeout(() => {
          setShouldRender(false)
        }, 500) // Match this with the CSS animation duration
        
        return () => clearTimeout(timer)
      }
    }
  }, [isLoading, progress])
  
  // Calculate loading progress based on loaded resources
  useEffect(() => {
    if (!isLoading && showComplete) return // Don't update progress anymore if completed
    
    const totalResources = Object.keys(resources).length
    if (totalResources === 0) return
    
    const loadedCount = Object.values(resources).filter(loaded => loaded).length
    const calculatedProgress = Math.round((loadedCount / totalResources) * 100)
    
    // Ensure we never hit 100% until all resources are actually loaded
    const targetProgress = loadedCount === totalResources 
      ? 100 
      : Math.min(Math.max(5, calculatedProgress), 95) // Cap at 95% if not all loaded
    
    if (targetProgress > progress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 1
          if (next >= targetProgress) {
            clearInterval(interval)
            return targetProgress
          }
          return next
        })
      }, 20)
      
      return () => clearInterval(interval)
    }
  }, [resources, progress, isLoading, showComplete])
  
  if (!shouldRender) return null
  
  return (
    <div className={`fixed inset-0 bg-white z-50 flex flex-col items-center justify-center ${fadeOut ? 'loading-fade-out' : ''}`}>
      <div className="mb-6">
        <img 
          src="/TailorMade-Logo.svg" 
          alt="TailorMade Logo" 
          className="w-24 h-24 md:w-32 md:h-32 app-loading-logo"
        />
      </div>
      
      <div className="flex flex-col items-center w-64">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="mt-2 text-gray-600 font-medium">
          {progress === 100 && showComplete
            ? "Sewing things up..."
            : `Altering appointments... ${progress}%`}
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen 