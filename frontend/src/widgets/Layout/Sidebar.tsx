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

const iconMap = {
  BarChart3,
  Target,
  Key,
  Settings,
  TrendingUp,
  Bell,
}

export function Sidebar() {
  const navigationItems = getNavigationItems()

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            📈
          </div>
          <span className="text-lg font-semibold">Trader Bot</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon ? iconMap[item.icon as keyof typeof iconMap] : null
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
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
          </li>
        </ul>
      </nav>
    </div>
  )
}
