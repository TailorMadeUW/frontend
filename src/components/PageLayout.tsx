import React, { ReactNode } from 'react'
import PageHeader from './PageHeader'

interface PageLayoutProps {
  title: string
  children: ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ title, children }) => {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-gray-50 lg:pt-0 pt-16">
      <PageHeader title={title} />
      <div className="flex-1 min-h-0 px-0 pb-0 sm:pb-6 sm:px-6">
        {children}
      </div>
    </div>
  )
}

export default PageLayout 