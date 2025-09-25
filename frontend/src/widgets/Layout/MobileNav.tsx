import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  Target, 
  Key, 
  Settings, 
  TrendingUp, 
  Bell 
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { getNavigationItems } from '@/app/router/routes'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet'

const iconMap = {
  BarChart3,
  Target,
  Key,
  Settings,
  TrendingUp,
  Bell,
}

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const navigationItems = getNavigationItems()

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                📈
              </div>
              <SheetTitle className="text-lg font-semibold">Trader Bot</SheetTitle>
            </div>
          </SheetHeader>

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <ul role="list" className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon ? iconMap[item.icon as keyof typeof iconMap] : null
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )
                      }
                    >
                      {Icon && (
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      )}
                      {item.title}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
