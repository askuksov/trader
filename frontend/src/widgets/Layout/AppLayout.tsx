import { ReactNode, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { PageContainer } from './PageContainer'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />

      {/* Main Content */}
      <div className="md:pl-64">
        <Header onMobileMenuClick={() => setIsMobileNavOpen(true)} />
        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  )
}
