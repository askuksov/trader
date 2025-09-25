import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { routeConfig } from '@/app/router/routes'
import { cn } from '@/shared/lib/utils'

interface BreadcrumbItem {
  title: string
  path: string
  isActive: boolean
}

export function Breadcrumb() {
  const location = useLocation()

  const breadcrumbItems = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []

    // Always start with home/dashboard
    items.push({
      title: 'Dashboard',
      path: '/',
      isActive: location.pathname === '/',
    })

    // Build breadcrumbs from path segments
    let currentPath = ''
    
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      
      // Find matching route config
      const matchedRoute = Object.values(routeConfig).find(
        (config) => {
          // Handle parameterized routes
          const configPath = config.path.replace(/:\w+/g, segment)
          return configPath === currentPath
        }
      )

      if (matchedRoute) {
        // Skip if it's the dashboard (already added)
        if (currentPath === '/') continue
        
        items.push({
          title: matchedRoute.title,
          path: currentPath,
          isActive: currentPath === location.pathname,
        })
      } else {
        // For unknown routes, use the segment as title
        items.push({
          title: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: currentPath,
          isActive: currentPath === location.pathname,
        })
      }
    }

    return items
  }, [location.pathname])

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="flex">
      <ol role="list" className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => (
          <li key={item.path}>
            <div className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              )}
              
              {item.isActive ? (
                <span className="text-sm font-medium text-foreground">
                  {item.title}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground",
                    index === 0 
                      ? "text-muted-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {index === 0 && (
                    <Home className="h-4 w-4 inline mr-1" />
                  )}
                  {item.title}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}
