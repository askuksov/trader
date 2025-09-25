/**
 * Application route definitions
 * Centralized route configuration following TypeScript best practices
 */

export const routes = {
  dashboard: '/',
  positions: {
    list: '/positions',
    create: '/positions/create',
    detail: '/positions/:id',
    edit: '/positions/:id/edit',
  },
  apiKeys: {
    list: '/api-keys',
    create: '/api-keys/create',
    edit: '/api-keys/:id/edit',
  },
  strategy: '/strategy',
  analytics: '/analytics',
  notifications: '/notifications',
  settings: '/settings',
} as const

/**
 * Route path builders with type safety
 */
export const buildRoute = {
  positions: {
    detail: (id: string | number) => `/positions/${id}`,
    edit: (id: string | number) => `/positions/${id}/edit`,
  },
  apiKeys: {
    edit: (id: string | number) => `/api-keys/${id}/edit`,
  },
} as const

/**
 * Route metadata for navigation and breadcrumbs
 */
export interface RouteConfig {
  path: string
  title: string
  icon?: string
  requiresAuth?: boolean
  showInNav?: boolean
  parentPath?: string
}

export const routeConfig: Record<string, RouteConfig> = {
  dashboard: {
    path: routes.dashboard,
    title: 'Dashboard',
    icon: 'BarChart3',
    requiresAuth: true,
    showInNav: true,
  },
  positions: {
    path: routes.positions.list,
    title: 'Positions',
    icon: 'Target',
    requiresAuth: true,
    showInNav: true,
  },
  positionsCreate: {
    path: routes.positions.create,
    title: 'Create Position',
    requiresAuth: true,
    showInNav: false,
    parentPath: routes.positions.list,
  },
  positionsDetail: {
    path: routes.positions.detail,
    title: 'Position Details',
    requiresAuth: true,
    showInNav: false,
    parentPath: routes.positions.list,
  },
  positionsEdit: {
    path: routes.positions.edit,
    title: 'Edit Position',
    requiresAuth: true,
    showInNav: false,
    parentPath: routes.positions.list,
  },
  apiKeys: {
    path: routes.apiKeys.list,
    title: 'API Keys',
    icon: 'Key',
    requiresAuth: true,
    showInNav: true,
  },
  apiKeysCreate: {
    path: routes.apiKeys.create,
    title: 'Add API Key',
    requiresAuth: true,
    showInNav: false,
    parentPath: routes.apiKeys.list,
  },
  apiKeysEdit: {
    path: routes.apiKeys.edit,
    title: 'Edit API Key',
    requiresAuth: true,
    showInNav: false,
    parentPath: routes.apiKeys.list,
  },
  strategy: {
    path: routes.strategy,
    title: 'Strategy',
    icon: 'Settings',
    requiresAuth: true,
    showInNav: true,
  },
  analytics: {
    path: routes.analytics,
    title: 'Analytics',
    icon: 'TrendingUp',
    requiresAuth: true,
    showInNav: true,
  },
  notifications: {
    path: routes.notifications,
    title: 'Notifications',
    icon: 'Bell',
    requiresAuth: true,
    showInNav: true,
  },
  settings: {
    path: routes.settings,
    title: 'Settings',
    icon: 'Settings',
    requiresAuth: true,
    showInNav: true,
  },
}

/**
 * Get navigation items for main navigation
 */
export const getNavigationItems = () =>
  Object.values(routeConfig).filter((config) => config.showInNav)
