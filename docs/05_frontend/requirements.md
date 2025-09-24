# Frontend Development Requirements

## Project Overview

**Project Name**: Spot Trading Bot Frontend  
**Technology Stack**: React 19+, TypeScript, TailwindCSS 4.1, Zustand + Redux, Shadcn/ui, Apache ECharts  
**Target Platform**: Single Page Application (SPA)  
**Target Users**: Cryptocurrency traders using DCA strategies

## System Architecture

Frontend application implementing Smart DCA (Dollar Cost Averaging) trading strategy management:
- Exchange API key management with secure storage
- DCA position creation and real-time monitoring  
- Trading strategy configuration with visual previews
- Performance analytics and comprehensive reporting

### Core Technologies
- **Framework**: React 19+ with TypeScript strict mode
- **State Management**: Zustand (UI states) + Redux Toolkit (business logic)
- **Styling**: TailwindCSS 4.1 + Shadcn/ui component system
- **Charts**: Apache ECharts via echarts-for-react
- **HTTP Client**: RTK Query with automatic caching
- **Routing**: React Router v6 with lazy loading
- **Build System**: Vite with code splitting
- **Code Quality**: ESLint + Prettier + TypeScript strict
- **Testing**: Jest + React Testing Library + Playwright E2E

### State Management Architecture

**Zustand Responsibilities**:
- Modal dialog states (open/closed/loading)
- Form validation states and error handling
- UI filters, sorting, and pagination states
- Navigation and layout preferences
- Toast notification queue management

**Redux Toolkit Responsibilities**:
- API data caching and synchronization
- Business entity state (positions, keys, strategies)
- Server state management with RTK Query
- Complex business logic computations
- Cross-component data sharing

---

## Development Tasks

### TASK-FRONTEND-001: Project Infrastructure Setup
**Status**: Completed
**Completion Date**: 2025-09-24

**Description**: Initialize React application with TypeScript, configure build tools, and establish project structure following Feature-Sliced Design architecture.

**Technical Requirements**:
- Vite + React 19+ + TypeScript strict mode configuration
- TailwindCSS 4.1 installation with CSS-first approach
- Shadcn/ui component library integration
- ESLint + Prettier configuration with project-specific rules
- Absolute import paths configuration
- Feature-Sliced Design directory structure

**File Structure**:
```
src/
├── app/           # Application layer
│   ├── providers/ # React Context providers
│   ├── store/     # Redux store configuration  
│   └── styles/    # Global styles and Tailwind config
├── pages/         # Page components with routing
├── widgets/       # Composite UI components
├── features/      # Business logic by feature domain
├── entities/      # Business entity logic and types
├── shared/        # Reusable utilities and components
│   ├── ui/        # Shadcn/ui based components
│   ├── lib/       # Utilities, hooks, constants
│   ├── api/       # API clients and configurations
│   └── types/     # TypeScript type definitions
└── assets/        # Static resources (images, icons)
```

**Acceptance Criteria**:
- `npm run dev` starts development server without errors
- TailwindCSS 4.1 compiles and applies styles correctly
- Shadcn/ui components install and render properly
- ESLint reports no violations on clean install
- Absolute imports resolve correctly (`@/shared/ui/button`)
- TypeScript strict mode enabled with zero errors
- Directory structure matches Feature-Sliced Design

**Dependencies**:
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0", 
  "typescript": "^5.4.0",
  "vite": "^5.0.0",
  "tailwindcss": "^4.1.0",
  "@radix-ui/react-*": "latest",
  "class-variance-authority": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest"
}
```

---

### TASK-FRONTEND-002: Shadcn/ui Component System
**Status**: Completed
**Assigned**: Senior Frontend Engineer
**Due Date**: 2025-09-24
**Completion Date**: 2025-09-24

**Description**: Configure Shadcn/ui component library with custom theming for trading application, ensuring mobile-first responsive design and accessibility compliance.

**Technical Requirements**:
- Install core Shadcn/ui components required for trading interface
- Configure custom theme using TailwindCSS 4.1 CSS variables
- Implement responsive design with mobile-first approach
- Create trading-specific component variants and compositions
- Ensure WCAG 2.1 AA accessibility compliance

**Components to Install**:
```typescript
// Core UI components
Button, Input, Card, Dialog, Sheet, Spinner, Alert, Badge,
Table, Select, Slider, Tabs, Progress, Tooltip, DropdownMenu,
Command, Form, Label, Switch, Checkbox, RadioGroup,
AlertDialog, ScrollArea, Separator, Avatar, Skeleton
```

**Custom Theme Configuration**:
```css
/* app/styles/globals.css */
@import "tailwindcss";

@theme {
  /* Light theme variables */
  --color-border: 214.3 31.8% 91.4%;
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  --color-primary: 221.2 83.2% 53.3%;
  --color-primary-foreground: 210 40% 98%;
  
  /* Trading-specific colors */
  --color-profit: 142 76% 36%;      /* Green for gains */
  --color-loss: 0 84% 60%;          /* Red for losses */
  --color-neutral: 210 40% 60%;     /* Gray for neutral */
  --color-warning: 38 92% 50%;      /* Orange for warnings */
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-border: 217.2 32.6% 17.5%;
    --color-background: 222.2 84% 4.9%;
    --color-foreground: 210 40% 98%;
    /* Dark theme overrides */
  }
}
```

**Acceptance Criteria**:
- All specified Shadcn/ui components render correctly
- Custom theme applies consistently across light/dark modes
- Components are fully responsive on mobile devices (320px+)
- Trading-specific color variants work properly
- All components pass accessibility audit (axe-core)
- Component documentation generated with Storybook

---

### TASK-FRONTEND-003: Apache ECharts Integration
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Integrate Apache ECharts for trading visualizations, create reusable chart components with trading-specific configurations, and ensure responsive behavior across devices.

**Technical Requirements**:
- Install echarts and echarts-for-react packages
- Create typed chart wrapper components for trading data
- Configure chart themes matching application design system
- Implement responsive chart behavior with automatic resizing
- Optimize chart performance for real-time data updates

**Chart Components**:
```typescript
// shared/ui/charts/
export interface ChartProps {
  data: unknown;
  loading?: boolean;
  height?: number;
  theme?: 'light' | 'dark';
  responsive?: boolean;
}

// Core chart components
- CandlestickChart: OHLC price data visualization
- LineChart: Price trends and performance lines  
- BarChart: Volume and transaction analytics
- PieChart: Portfolio distribution visualization
- ScatterChart: Correlation analysis plots
- Heatmap: Trading pair performance matrix
- ChartContainer: Base wrapper with common functionality
```

**Trading Theme Configuration**:
```typescript
export const tradingChartTheme = {
  color: [
    '#26a69a', // Bullish green
    '#ef5350', // Bearish red  
    '#42a5f5', // Primary blue
    '#ab47bc', // Secondary purple
    '#78909c', // Neutral gray
    '#ff7043', // Warning orange
    '#9ccc65', // Success light green
    '#ffa726'  // Accent amber
  ],
  backgroundColor: 'transparent',
  textStyle: {
    color: 'hsl(var(--foreground))',
    fontFamily: 'var(--font-sans)'
  },
  grid: {
    borderColor: 'hsl(var(--border))',
    backgroundColor: 'transparent'
  },
  // Candlestick specific styling
  series: {
    candlestick: {
      itemStyle: {
        color: '#26a69a',        // Bullish candle
        color0: '#ef5350',       // Bearish candle
        borderColor: '#26a69a',  // Bullish border
        borderColor0: '#ef5350'  // Bearish border
      }
    }
  }
};
```

**Acceptance Criteria**:
- All chart components render correctly with sample data
- Charts automatically resize on viewport changes
- Trading theme applies consistently across all chart types
- Chart performance handles 1000+ data points smoothly
- Components are fully typed with proper TypeScript interfaces
- Charts support both light and dark themes
- Real-time data updates work without performance degradation

---

### TASK-FRONTEND-004: Routing and Layout System
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Implement application routing with React Router v6, create responsive layout system using Shadcn/ui components, and establish navigation patterns for desktop and mobile interfaces.

**Technical Requirements**:
- Configure React Router v6 with lazy loading for all pages
- Build responsive layout using Shadcn/ui layout components
- Implement protected routes with authentication guards
- Create mobile navigation with hamburger menu and drawer
- Add breadcrumb navigation with route context

**Route Configuration**:
```typescript
// app/router/routes.tsx
export const routes = {
  dashboard: '/',
  positions: {
    list: '/positions',
    create: '/positions/create', 
    detail: '/positions/:id',
    edit: '/positions/:id/edit'
  },
  apiKeys: {
    list: '/api-keys',
    create: '/api-keys/create',
    edit: '/api-keys/:id/edit'
  },
  strategy: '/strategy',
  analytics: '/analytics', 
  notifications: '/notifications',
  settings: '/settings'
} as const;
```

**Layout Components**:
```typescript
// widgets/Layout/
- AppLayout.tsx:      Main layout with Shadcn components
- Header.tsx:         Top navigation with user menu
- Sidebar.tsx:        Desktop navigation sidebar  
- MobileNav.tsx:      Mobile drawer navigation
- Breadcrumb.tsx:     Route-aware breadcrumb navigation
- PageContainer.tsx:  Content wrapper with padding/margins

// app/router/
- AppRouter.tsx:      Main router configuration
- ProtectedRoute.tsx: Authentication guard wrapper
- RouteGuard.tsx:     Role-based access control
```

**Acceptance Criteria**:
- All routes load correctly with lazy loading
- Layout responds properly on mobile devices (320px-768px)
- Protected routes redirect unauthenticated users
- Mobile navigation opens/closes smoothly with touch gestures
- Breadcrumb navigation reflects current route accurately
- Page transitions are smooth without layout shifts
- Back button navigation works correctly in SPA

---

### TASK-FRONTEND-005: State Management Foundation
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Configure Zustand for UI state management and Redux Toolkit with RTK Query for business data, establish typing patterns and store organization following separation of concerns.

**Technical Requirements**:
- Install and configure Zustand with TypeScript support
- Set up Redux Toolkit store with RTK Query for API management
- Create store organization following domain separation
- Implement error handling middleware for API operations  
- Add development tools integration (Redux DevTools, Zustand DevTools)

**Zustand Store Structure**:
```typescript
// shared/lib/stores/
interface UIStore {
  modals: {
    createPosition: boolean;
    editApiKey: boolean;
    confirmDelete: string | null;
  };
  setModal: (modal: keyof UIStore['modals'], value: boolean | string | null) => void;
}

interface FiltersStore {
  positions: {
    status: PositionStatus[];
    tradingPairs: string[];
    apiKeyIds: number[];
    dateRange: DateRange | null;
  };
  setPositionFilter: (key: string, value: unknown) => void;
  resetPositionFilters: () => void;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}
```

**Redux Store Structure**:
```typescript
// app/store/
- index.ts:           Store configuration and middleware
- baseApi.ts:         RTK Query base API configuration

// entities/*/api/
- positionsApi.ts:    Position CRUD operations
- apiKeysApi.ts:      API key management endpoints
- strategyApi.ts:     Strategy configuration endpoints  
- analyticsApi.ts:    Analytics and reporting endpoints
- marketApi.ts:       Market data and price feeds
```

**Core TypeScript Interfaces**:
```typescript
// shared/types/entities.ts
export interface Position {
  id: number;
  trading_pair: string;
  status: 'active' | 'completed' | 'paused' | 'error';
  total_invested: number;
  total_quantity: number;
  average_price: number;
  current_price: number;
  realized_profit: number;
  unrealized_profit: number;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: number;
  name: string;
  exchange: 'hitbtc' | 'binance';
  status: 'active' | 'inactive' | 'error';
  description?: string;
  created_at: string;
  last_used_at: string | null;
}

export interface DCALevel {
  id: number;
  position_id: number;
  level: number;
  trigger_price_percent: number;
  trigger_price: number;
  amount: number;
  status: 'pending' | 'triggered' | 'filled' | 'cancelled';
  executed_at: string | null;
}
```

**Acceptance Criteria**:
- Zustand stores handle UI state without Redux coupling
- Redux store manages API data with proper caching
- All stores are fully typed with TypeScript interfaces
- Error handling middleware catches and processes API errors
- DevTools integration works in development environment
- Store organization follows domain-driven design principles
- State updates trigger component re-renders efficiently

---

### TASK-FRONTEND-006: API Key Management Interface
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Implement complete CRUD interface for exchange API key management with secure handling, connection testing, and responsive table/card layouts.

**Technical Requirements**:
- Create responsive table using Shadcn/ui Table component
- Implement secure API key input with masking/reveal functionality
- Add connection testing with loading states and error handling
- Build mobile-responsive card layout for small screens
- Integrate search and filtering using Zustand state management

**API Endpoints**:
```typescript
// RTK Query endpoints
GET    /api/v1/api-keys                    // List all keys
POST   /api/v1/api-keys                    // Create new key
PUT    /api/v1/api-keys/{id}               // Update key (name/description only)
DELETE /api/v1/api-keys/{id}               // Delete key
POST   /api/v1/api-keys/test-connection    // Test key validity
GET    /api/v1/api-keys/{id}/positions     // Get associated positions
```

**Component Structure**:
```typescript
// pages/ApiKeysPage/
- ApiKeysPage.tsx:           Main page component with layout
- components/ApiKeysList.tsx:     Shadcn Table with sorting/filtering
- components/ApiKeysFilters.tsx:  Search and exchange filter controls
- components/ApiKeyCard.tsx:      Mobile card layout component
- components/ApiKeyActions.tsx:   Action dropdown menu per row

// features/api-keys/
- components/CreateApiKeyDialog.tsx:  Shadcn Dialog with form
- components/EditApiKeyDialog.tsx:    Edit dialog (name/description)
- components/DeleteConfirmDialog.tsx: Shadcn AlertDialog confirmation
- components/ApiKeyForm.tsx:          Reusable form with validation
- components/ConnectionTest.tsx:      Connection testing component
- hooks/useApiKeyActions.ts:          CRUD operations logic
- stores/useApiKeyFilters.ts:         Zustand filter state
```

**Form Validation**:
```typescript
// API key creation validation
interface CreateApiKeyForm {
  name: string;           // Required, 1-50 chars, unique
  exchange: 'hitbtc' | 'binance'; // Required
  api_key: string;       // Required, min 32 chars
  secret_key: string;    // Required, min 32 chars  
  description?: string;  // Optional, max 200 chars
}

const validationRules = {
  name: yup.string().required().min(1).max(50),
  exchange: yup.string().oneOf(['hitbtc', 'binance']).required(),
  api_key: yup.string().required().min(32),
  secret_key: yup.string().required().min(32),
  description: yup.string().max(200)
};
```

**Acceptance Criteria**:
- API keys list displays with real-time status updates
- Search and filtering work instantly without API calls
- Mobile layout switches to cards below 768px breakpoint
- Connection testing validates keys before saving
- Key masking prevents accidental exposure in UI
- Delete operation blocked when positions are active
- All CRUD operations show loading states and error messages
- Form validation prevents invalid data submission

---

### TASK-FRONTEND-007: Position Creation Wizard
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Build multi-step position creation wizard with parameter configuration, real-time calculations, strategy visualization, and comprehensive validation.

**Technical Requirements**:
- Create multi-step form using Zustand for step management
- Implement real-time parameter calculations and validation
- Add interactive DCA strategy visualization using ECharts
- Build trading pair autocomplete with market data integration
- Include balance checking and fee calculation before confirmation

**Wizard Steps**:
```typescript
// Step 1: Basic Configuration  
- API key selection (active keys only)
- Trading pair selection with autocomplete
- Real-time price display and balance checking
- Initial investment amount input

// Step 2: DCA Strategy Configuration
- DCA level percentage configuration (sliders)
- Take-profit level configuration (sliders)  
- Interactive strategy preview chart
- Preset configuration options

// Step 3: Review and Confirmation
- Complete parameter summary
- Fee calculation display
- Final balance sufficiency check
- Position creation confirmation
```

**Component Architecture**:
```typescript
// pages/CreatePositionPage/
- CreatePositionPage.tsx:         Main wizard container
- steps/BasicConfigStep.tsx:      Step 1 - pair/key/amount
- steps/StrategyConfigStep.tsx:   Step 2 - DCA parameters
- steps/ConfirmationStep.tsx:     Step 3 - review/create
- components/StepNavigation.tsx:  Progress indicator and navigation
- components/PairSelector.tsx:    Trading pair autocomplete
- components/ApiKeySelector.tsx:  API key dropdown with balances

// features/create-position/  
- stores/useCreatePositionStore.ts:  Wizard state management
- components/DCALevelsConfig.tsx:    Level configuration sliders
- components/TakeProfitConfig.tsx:   Take-profit sliders
- components/StrategyPreview.tsx:    ECharts visualization
- components/PresetSelector.tsx:     Preset configuration tabs
- hooks/useMarketData.ts:           Real-time price updates
- hooks/usePositionCalculations.ts: Parameter calculations
```

**DCA Configuration Interface**:
```typescript
interface DCAConfiguration {
  deposit_amount: number;           // Total investment amount
  initial_percent: number;          // First purchase % (default 50%)
  dca_levels: Array<{
    trigger_percent: number;        // Price drop % (-3%, -7%, -12%)
    amount_percent: number;         // Purchase amount % (15%, 20%, 15%)
  }>;
  take_profits: Array<{
    price_percent: number;          // Price gain % (+8%, +15%, +25%)
    quantity_percent: number;       // Sell quantity % (25%, 35%, 40%)
  }>;
}

// Real-time calculations
interface CalculatedPosition {
  total_levels: number;
  max_drawdown_percent: number;
  expected_profit_percent: number;
  required_balance: number;
  estimated_fees: number;
  completion_scenarios: ProfitScenario[];
}
```

**Acceptance Criteria**:
- Wizard navigation works smoothly with step validation
- Trading pair autocomplete searches top 100 pairs efficiently
- Real-time price updates work without performance issues
- DCA parameter sliders update calculations instantly
- Strategy preview chart clearly shows levels and profits
- Balance checking prevents insufficient fund positions
- Form validation blocks invalid parameter combinations
- Position creates successfully with all configured parameters

---

### TASK-FRONTEND-008: Position Monitoring Dashboard
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Build comprehensive position monitoring interface with real-time updates, detailed analytics, and management controls for active DCA positions.

**Technical Requirements**:
- Create responsive table/card layout for position list
- Implement real-time P&L updates via WebSocket connection
- Build detailed position view with interactive price charts
- Add position management controls (pause/resume/close)
- Integrate filtering and sorting with persistent state

**API Endpoints**:
```typescript
GET    /api/v1/positions                     // List positions with filters
GET    /api/v1/positions/{id}                // Position details
GET    /api/v1/positions/{id}/dca-levels     // DCA level status
GET    /api/v1/positions/{id}/take-profits   // Take-profit levels
GET    /api/v1/positions/{id}/history        // Transaction history
PUT    /api/v1/positions/{id}/pause          // Pause position
PUT    /api/v1/positions/{id}/resume         // Resume position  
DELETE /api/v1/positions/{id}                // Close position
WebSocket: /ws/positions/{id}                // Real-time updates
```

**Position List Interface**:
```typescript
// pages/PositionsPage/
- PositionsPage.tsx:              Main positions page layout
- components/PositionsList.tsx:   Responsive table using Shadcn Table
- components/PositionsFilters.tsx: Filter controls with Zustand state
- components/PositionCard.tsx:    Mobile card layout component
- components/PositionStatusBadge.tsx: Status indicator component

// Real-time data display
interface PositionListItem {
  id: number;
  trading_pair: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  total_invested: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  current_price: number;
  average_price: number;
  active_dca_level: number;
  next_dca_trigger?: number;
  created_at: string;
}
```

**Position Details Interface**:
```typescript
// pages/PositionDetailsPage/
- PositionDetailsPage.tsx:        Main detail page layout
- components/PositionMetrics.tsx: Key metrics cards
- components/PriceChart.tsx:      Interactive price chart with markers
- components/DCALevelsTable.tsx:  DCA level status table
- components/TakeProfitTable.tsx: Take-profit level status
- components/TransactionHistory.tsx: Complete transaction log
- components/PositionActions.tsx: Management action buttons

// shared/ui/charts/
- TradingChart.tsx:               ECharts candlestick with overlays
- components/ChartMarkers.tsx:    DCA and TP level indicators
```

**Real-Time Updates**:
```typescript
// features/positions/
- hooks/useRealTimePositions.ts:  WebSocket position updates
- hooks/usePositionActions.ts:    Position management operations
- stores/usePositionsFilters.ts:  Filter and sort state

// WebSocket message types
interface PositionUpdate {
  position_id: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  dca_level_triggered?: number;
  take_profit_executed?: number;
  timestamp: string;
}
```

**Acceptance Criteria**:
- Position list loads quickly with 100+ positions
- Real-time price updates work smoothly without UI lag
- Filtering and sorting persist across page navigation
- Mobile card layout provides full functionality
- Position detail charts show accurate DCA/TP markers
- Management actions (pause/resume/close) work with confirmation
- Transaction history loads progressively for large datasets
- WebSocket reconnection handles network interruptions gracefully

---

### TASK-FRONTEND-009: Strategy Configuration Interface
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Create comprehensive strategy configuration interface for managing default DCA parameters, pair-specific settings, and risk management rules with visual feedback.

**Technical Requirements**:
- Build global DCA settings form with interactive parameter adjustment
- Implement pair-specific configuration overrides
- Add strategy preset management (Conservative/Balanced/Aggressive)
- Create visual strategy preview with expected outcome calculations
- Include import/export functionality for strategy configurations

**API Endpoints**:
```typescript
GET    /api/v1/strategy/dca-settings           // Global DCA settings
PUT    /api/v1/strategy/dca-settings           // Update global settings
GET    /api/v1/strategy/pair-settings          // Pair-specific overrides
PUT    /api/v1/strategy/pair-settings/{pair}   // Update pair settings
GET    /api/v1/strategy/presets                // Available presets
POST   /api/v1/strategy/presets                // Create custom preset
GET    /api/v1/strategy/supported-pairs        // Supported trading pairs
```

**Global Strategy Configuration**:
```typescript
// pages/StrategySettingsPage/
- StrategySettingsPage.tsx:           Main strategy configuration page
- components/GlobalDCASettings.tsx:   Default DCA parameter form
- components/RiskManagementSettings.tsx: Risk limits and safeguards
- components/StrategyPreview.tsx:     Visual preview with ECharts
- components/PresetManagement.tsx:    Preset creation and selection

interface DCAStrategySettings {
  // Purchase distribution
  initial_amount_percent: number;     // First purchase (30-70%)
  
  // DCA trigger levels  
  dca_levels: Array<{
    trigger_percent: number;          // Price drop (-2% to -20%)
    amount_percent: number;           // Purchase amount (5-40%)
  }>;
  
  // Take-profit configuration
  take_profit_levels: Array<{
    trigger_percent: number;          // Price gain (+5% to +50%)
    quantity_percent: number;         // Sell quantity (10-50%)
  }>;
  
  // Risk management
  max_positions_per_key: number;     // Concurrent positions (1-10)
  max_amount_per_position: number;   // Maximum investment per position
  stop_loss_percent?: number;        // Emergency stop-loss (-50% to -10%)
  daily_loss_limit?: number;         // Daily loss limit in USD
}
```

**Pair-Specific Configuration**:
```typescript
// features/strategy/
- components/PairSpecificSettings.tsx:  Trading pair configuration table
- components/PairSettingsDialog.tsx:    Individual pair settings modal
- components/BulkOperations.tsx:        Bulk enable/disable operations
- hooks/usePairSettings.ts:            Pair configuration management

interface PairSettings {
  pair: string;
  enabled: boolean;
  override_global: boolean;
  custom_settings?: Partial<DCAStrategySettings>;
  max_position_size?: number;
  priority: 'high' | 'medium' | 'low';
}
```

**Strategy Visualization**:
```typescript
// shared/ui/charts/
- StrategyPreviewChart.tsx:          DCA strategy visualization
- components/ExpectedOutcomeChart.tsx: Profit/loss scenarios
- components/RiskAnalysisChart.tsx:   Risk distribution analysis

// Visual elements to display
- DCA trigger levels on price chart
- Expected purchase amounts at each level  
- Take-profit targets and quantities
- Worst-case and best-case scenarios
- Risk-reward ratio visualization
```

**Acceptance Criteria**:
- Global settings form validates parameters in real-time
- Strategy preview updates instantly when parameters change
- Preset configurations apply correctly to all parameters
- Pair-specific settings override global settings appropriately  
- Bulk operations work efficiently for large pair lists
- Import/export preserves all configuration data accurately
- Visual previews clearly communicate strategy behavior
- Risk management limits prevent dangerous configurations

---

### TASK-FRONTEND-010: Analytics and Reporting Dashboard
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Build comprehensive analytics dashboard with performance metrics, interactive charts, detailed reporting, and data export capabilities for DCA trading strategy analysis.

**Technical Requirements**:
- Create responsive dashboard with key performance metrics
- Implement interactive charts for performance analysis
- Build detailed reporting interface with advanced filtering
- Add data export functionality in multiple formats
- Integrate real-time performance calculations and updates

**API Endpoints**:
```typescript
GET /api/v1/analytics/overview                // Dashboard overview metrics
GET /api/v1/analytics/performance             // Performance over time
GET /api/v1/analytics/positions-summary       // Position statistics  
GET /api/v1/analytics/pair-performance        // Trading pair analysis
GET /api/v1/analytics/api-key-performance     // API key comparison
GET /api/v1/analytics/completed-positions     // Historical position data
GET /api/v1/analytics/export                  // Data export endpoint
```

**Dashboard Overview**:
```typescript
// pages/DashboardPage/
- DashboardPage.tsx:              Main analytics dashboard
- widgets/MetricsOverview.tsx:    Key performance metric cards
- widgets/PerformanceChart.tsx:   Portfolio performance line chart
- widgets/TopPositions.tsx:       Best/worst performing positions
- widgets/ApiKeysStatus.tsx:      API key utilization summary
- widgets/RecentActivity.tsx:     Latest transactions and events

interface DashboardMetrics {
  // Portfolio metrics
  total_invested: number;
  total_current_value: number;
  total_realized_pnl: number;
  total_unrealized_pnl: number;
  total_pnl_percent: number;
  
  // Position statistics  
  active_positions: number;
  completed_positions: number;
  paused_positions: number;
  average_position_duration: number;
  
  // Performance metrics
  win_rate_percent: number;
  average_profit_per_position: number;
  best_performing_pair: string;
  worst_performing_pair: string;
  sharpe_ratio?: number;
  max_drawdown_percent: number;
}
```

**Performance Analytics**:
```typescript
// pages/AnalyticsPage/
- AnalyticsPage.tsx:                Main detailed analytics page
- components/PerformanceComparison.tsx: API key performance comparison
- components/PairHeatmap.tsx:          Trading pair performance heatmap  
- components/ProfitDistribution.tsx:   P&L distribution analysis
- components/TimeSeriesAnalysis.tsx:   Performance over time periods
- components/AdvancedFilters.tsx:      Complex filtering interface

// features/analytics/
- stores/useAnalyticsFilters.ts:      Analytics filter state management
- hooks/usePerformanceCalculations.ts: Performance metric calculations
- hooks/useExportData.ts:             Data export functionality
```

**Interactive Charts**:
```typescript
// shared/ui/charts/analytics/
- PortfolioPerformanceChart.tsx:     Portfolio value over time
- PairPerformanceHeatmap.tsx:        Trading pair correlation matrix
- ProfitLossDistribution.tsx:        Histogram of position outcomes
- DrawdownChart.tsx:                 Portfolio drawdown visualization
- MonthlyReturnsChart.tsx:           Monthly performance breakdown

// Chart configurations for analytics
interface ChartConfig {
  type: 'line' | 'bar' | 'heatmap' | 'scatter' | 'pie';
  timeframe: '24h' | '7d' | '30d' | '3m' | '1y' | 'all';
  groupBy: 'day' | 'week' | 'month';
  metrics: PerformanceMetric[];
}
```

**Data Export**:
```typescript
// Export functionality
interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  dateRange: DateRange;
  includeClosedPositions: boolean;
  includeTransactionHistory: boolean;
  includeAnalytics: boolean;
}

// Export components
- components/ExportDialog.tsx:       Export configuration modal
- components/ReportGenerator.tsx:    PDF report generation
- hooks/useDataExport.ts:           Export logic and file generation
```

**Acceptance Criteria**:
- Dashboard loads quickly with all metrics displaying correctly
- Interactive charts respond smoothly to filter changes
- Performance calculations match backend accuracy
- Data export generates correct files in all supported formats
- Advanced filtering works with complex date/pair/status combinations
- Real-time updates reflect latest position changes
- Mobile layout maintains chart readability and interaction
- All performance metrics include appropriate tooltips and explanations

---

### TASK-FRONTEND-011: Notification System Integration
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Implement comprehensive notification system with Telegram integration, in-app notifications, push notifications, and granular notification preferences management.

**Technical Requirements**:
- Integrate Telegram bot for external notifications
- Implement in-app toast notifications using Shadcn Toast
- Add PWA push notification support
- Create notification preferences interface with granular controls
- Build notification history with search and filtering capabilities

**API Endpoints**:
```typescript
GET    /api/v1/notifications/settings         // Notification preferences
PUT    /api/v1/notifications/settings         // Update preferences
POST   /api/v1/notifications/telegram/setup   // Link Telegram account
DELETE /api/v1/notifications/telegram/unlink  // Unlink Telegram
POST   /api/v1/notifications/test             // Test notifications
GET    /api/v1/notifications/history          // Notification history
```

**Notification Types**:
```typescript
interface NotificationSettings {
  // Trading events
  position_created: NotificationChannel[];
  dca_level_triggered: NotificationChannel[];
  take_profit_executed: NotificationChannel[];
  position_completed: NotificationChannel[];
  position_paused: NotificationChannel[];
  
  // System events  
  api_key_error: NotificationChannel[];
  balance_insufficient: NotificationChannel[];
  connection_lost: NotificationChannel[];
  system_maintenance: NotificationChannel[];
  
  // Performance alerts
  daily_loss_limit_reached: NotificationChannel[];
  position_profit_threshold: NotificationChannel[];
  unusual_price_movement: NotificationChannel[];
}

type NotificationChannel = 'telegram' | 'in_app' | 'push' | 'email';
```

**Component Architecture**:
```typescript
// pages/NotificationsPage/
- NotificationsPage.tsx:             Main notification settings page
- components/TelegramSetup.tsx:      Telegram bot integration setup
- components/NotificationTypes.tsx:  Granular notification controls
- components/NotificationHistory.tsx: Historical notification log
- components/TestNotifications.tsx:  Notification testing interface

// features/notifications/
- stores/useNotificationSettings.ts:  Notification preferences state
- hooks/useInAppNotifications.ts:     Toast notification management
- hooks/usePushNotifications.ts:      PWA push notification handling
- hooks/useTelegramIntegration.ts:    Telegram bot communication
- components/NotificationToast.tsx:   Custom toast component
```

**In-App Notifications**:
```typescript
// Real-time notification handling
interface InAppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration: number;
  timestamp: Date;
}

// Toast notification system
- components/NotificationProvider.tsx: Global notification context
- components/NotificationToast.tsx:    Individual toast component  
- hooks/useNotifications.ts:           Notification management hook
```

**Telegram Integration**:
```typescript
// Telegram bot setup flow
interface TelegramSetup {
  bot_token: string;
  chat_id?: string;
  setup_complete: boolean;
  qr_code?: string;
  verification_code?: string;
}

// Telegram message formatting
interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
  reply_markup?: InlineKeyboard;
}
```

**Acceptance Criteria**:
- Telegram integration setup works with QR code scanning
- In-app toasts appear for all configured notification types
- Push notifications work on PWA-installed applications
- Notification preferences save and apply immediately
- Test notifications successfully deliver via all channels
- Notification history displays with search and filtering
- Real-time notifications arrive within 5 seconds of events
- Notification settings export/import preserves all configurations

---

### TASK-FRONTEND-012: Application Settings and PWA
**Status**: Pending  
**Assigned**: TBD  
**Due Date**: TBD  
**Completion Date**: TBD

**Description**: Implement application settings interface, Progressive Web App capabilities, theme management, localization support, and comprehensive performance optimization.

**Technical Requirements**:
- Create comprehensive application settings interface
- Implement PWA functionality with offline capabilities  
- Add theme switching with system preference detection
- Build localization system for multi-language support
- Optimize application performance with code splitting and caching

**Settings Interface**:
```typescript
// pages/SettingsPage/
- SettingsPage.tsx:                  Main settings page with tabs
- components/AppearanceSettings.tsx: Theme and UI preferences
- components/LocalizationSettings.tsx: Language and region settings
- components/DisplaySettings.tsx:    Number formatting and timezone
- components/SecuritySettings.tsx:   Security and privacy options
- components/DataManagement.tsx:     Backup, export, import operations

interface ApplicationSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  color_scheme: string;
  compact_mode: boolean;
  animations_enabled: boolean;
  
  // Localization  
  language: 'en' | 'ru' | 'es' | 'de';
  currency: 'USD' | 'EUR' | 'RUB' | 'BTC';
  timezone: string;
  date_format: string;
  number_format: 'US' | 'EU' | 'RU';
  
  // Display
  default_chart_period: '1h' | '4h' | '1d' | '1w';
  positions_per_page: number;
  show_realized_pnl: boolean;
  show_unrealized_pnl: boolean;
  
  // Behavior
  confirm_dangerous_actions: boolean;
  auto_refresh_interval: number;
  sound_notifications: boolean;
}
```

**Progressive Web App**:
```typescript
// PWA configuration
- public/manifest.json:              PWA manifest file
- public/sw.js:                     Service worker
- app/pwa/ServiceWorker.ts:         Service worker registration
- app/pwa/OfflineHandler.ts:        Offline functionality

// PWA features
interface PWACapabilities {
  offline_mode: boolean;           // View positions offline
  push_notifications: boolean;     // Native push notifications
  installable: boolean;           // Add to homescreen
  background_sync: boolean;       // Sync when connection restored
}

// Offline data strategy
interface OfflineData {
  positions: Position[];          // Cache active positions
  api_keys: ApiKey[];            // Cache key information  
  last_sync: Date;               // Last synchronization time
}
```

**Theme Management**:
```typescript
// shared/lib/theme/
- ThemeProvider.tsx:               React context for theme management
- useTheme.ts:                    Theme management hook
- themes.ts:                      Theme definitions

interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    profit: string;
    loss: string;
    neutral: string;
  };
  fonts: {
    sans: string[];
    mono: string[];
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
}
```

**Localization System**:
```typescript
// shared/lib/i18n/
- i18n.ts:                        i18next configuration
- LocalizationProvider.tsx:       React i18n provider
- translations/en.json:           English translations
- translations/ru.json:           Russian translations

// Translation keys structure
interface Translations {
  navigation: {
    dashboard: string;
    positions: string;
    apiKeys: string;
    strategy: string;
    analytics: string;
  };
  positions: {
    status: {
      active: string;
      completed: string;
      paused: string;
      error: string;
    };
    metrics: {
      totalInvested: string;
      currentValue: string;
      unrealizedPnL: string;
    };
  };
  // Additional translation namespaces
}
```

**Performance Optimization**:
```typescript
// Performance enhancements
- Route-based code splitting with React.lazy()
- Component lazy loading for heavy charts
- Image optimization and lazy loading  
- Bundle analysis and tree shaking
- Service worker caching strategies
- Memory leak prevention

// Lazy loading implementation
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const TradingChart = lazy(() => import('../shared/ui/charts/TradingChart'));

// Performance monitoring
- Web Vitals integration
- Error boundary with crash reporting
- Performance metrics logging
- Bundle size monitoring
```

**Acceptance Criteria**:
- PWA installs correctly on mobile and desktop platforms
- Offline mode displays cached position data without errors
- Theme switching works instantly with system preference sync
- Localization covers all UI text with proper formatting
- Application settings persist across browser sessions
- Performance audit scores 90+ on all Lighthouse metrics
- Bundle size remains under 1MB gzipped after optimization
- Service worker updates automatically without user intervention

---

## Quality Standards

### Code Quality Requirements
- **TypeScript**: Strict mode enabled, no `any` types except for external libraries
- **ESLint**: Zero violations using project-specific rules extending Airbnb config  
- **Prettier**: Consistent code formatting with 2-space indentation
- **Testing**: Minimum 80% code coverage for utilities and business logic
- **Performance**: Bundle size < 1MB gzipped, First Contentful Paint < 2s
- **Accessibility**: WCAG 2.1 AA compliance verified with axe-core

### Component Standards
- **Reusability**: All UI components accept generic props and support composition
- **TypeScript**: Full typing with proper interfaces and generic constraints
- **Documentation**: JSDoc comments for all public interfaces and complex logic
- **Testing**: Unit tests for all reusable components and custom hooks
- **Performance**: React.memo for expensive components, proper dependency arrays

### State Management Standards
- **Separation**: UI state in Zustand, business data in Redux RTK Query
- **Typing**: Full TypeScript interfaces for all store shapes and actions
- **Performance**: Minimal re-renders with proper selector optimization
- **Persistence**: Critical settings persist in localStorage with versioning
- **Error Handling**: Comprehensive error boundaries and API error management

### Security Requirements
- **Input Validation**: Client-side validation for all user inputs
- **XSS Protection**: Proper sanitization of dynamic content
- **API Keys**: Secure storage and display masking for sensitive data
- **CSP**: Content Security Policy configuration for XSS prevention
- **Dependencies**: Regular dependency audits and updates

### Testing Strategy
- **Unit Tests**: Jest + React Testing Library for component testing
- **Integration Tests**: API integration and state management testing
- **E2E Tests**: Playwright for critical user journey testing  
- **Visual Tests**: Storybook with visual regression testing
- **Performance Tests**: Lighthouse CI for performance regression detection

### Documentation Requirements
- **README**: Setup instructions, development workflow, deployment process
- **Component Docs**: Storybook stories for all reusable components
- **API Docs**: OpenAPI integration for backend API documentation
- **Architecture Docs**: Decision records for major technical choices
- **Changelog**: Detailed change log following Keep a Changelog format

---

## Development Workflow

### Code Organization
```
docs/05_frontend/
├── requirements.md           # This file
├── changelog.md             # Frontend change log
├── architecture.md          # Technical decisions and patterns
├── testing-strategy.md      # Testing approach and standards
└── deployment.md           # Build and deployment procedures
```

### Task Management
- All tasks must follow `TASK-FRONTEND-NNN` numbering convention
- Each task requires status tracking: Pending → In Progress → Review → Complete
- Completion requires: working code, tests, documentation updates, changelog entry
- Task dependencies must be clearly identified and resolved in order

### Code Review Requirements
- All code changes require peer review before merge
- TypeScript compilation must pass without errors or warnings
- ESLint and Prettier checks must pass without violations
- Unit tests must pass with coverage requirements met
- Performance impact assessment for significant changes

### Definition of Done
- Feature implemented according to technical requirements
- Component tests written and passing with adequate coverage
- Integration with existing codebase completed without breaking changes
- Documentation updated including JSDoc comments and changelog
- Code review completed and approved by technical lead
- Deployment to staging environment successful with QA validation
