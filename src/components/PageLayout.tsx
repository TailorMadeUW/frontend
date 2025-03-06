import React, { ReactNode } from 'react'
import PageHeader from './PageHeader'

interface PageLayoutProps {
  title: string
  children: ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ title, children }) => {
  return (
    <div className="flex flex-col flex-1 h-full bg-gray-50 lg:pt-0 pt-16">
      <PageHeader title={title} />
      <div className="flex-1 min-h-0 px-0 pb-6 pt-1 lg:pt-0 sm:pb-8 sm:px-6 overflow-auto">
        {children}
        {/* Extra space at bottom to avoid iOS URL bar overlap */}
        <div className="h-16 w-full"></div>
      </div>
    </div>
  )
}

export default PageLayout 