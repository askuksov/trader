# TASK-FRONTEND-006: API Key Management Interface - Testing Guide

## Overview

This document provides comprehensive testing instructions for the API Key Management Interface implementation. The interface provides complete CRUD operations for exchange API keys with security features, responsive design, and comprehensive validation.

## Features Implemented

### Core Functionality
- ✅ **Complete CRUD Operations**: Create, Read, Update, Delete API keys
- ✅ **Secure Input Handling**: Password masking, API key preview masking
- ✅ **Connection Testing**: Real-time validation before saving credentials
- ✅ **Responsive Design**: Automatic table/card layout switching
- ✅ **Advanced Filtering**: Multi-dimensional search and filtering
- ✅ **State Management**: Zustand for UI state, Redux RTK Query for data

### Security Features
- ✅ **Input Validation**: Client-side validation with Zod schemas
- ✅ **Credential Masking**: API keys displayed as `abc...xyz` format
- ✅ **Connection Testing**: Mandatory testing before key creation
- ✅ **Position Validation**: Delete protection for keys with active positions
- ✅ **Error Handling**: Comprehensive error feedback without exposing sensitive data

### User Experience
- ✅ **Mobile-First Design**: Responsive layout with automatic switching
- ✅ **Real-time Search**: Instant client-side filtering
- ✅ **Loading States**: Visual feedback for all operations
- ✅ **Success/Error Notifications**: Toast notifications for all actions
- ✅ **Keyboard Navigation**: Full keyboard accessibility support

## Manual Testing Instructions

### 1. Page Load and Layout Testing

#### Desktop Testing (1024px+)
```bash
# Navigate to API Keys page
http://localhost:3000/api-keys

# Expected Results:
- Page loads without errors
- Table layout is displayed
- Header shows "API Keys" with "Add API Key" button
- Filter controls are visible and functional
- Search bar is accessible and responsive
```

#### Tablet Testing (768px - 1023px)
```bash
# Resize browser window or use DevTools device simulation
# Expected Results:
- Layout remains functional
- Table may switch to card layout depending on content
- Filter controls adapt to smaller screen
- Navigation remains accessible
```

#### Mobile Testing (320px - 767px)
```bash
# Use mobile device or browser DevTools mobile simulation
# Expected Results:
- Automatic switch to card layout
- Mobile navigation drawer appears
- Touch-friendly interface elements
- Proper text sizing and spacing
- Horizontal scrolling avoided
```

### 2. API Key Creation Testing

#### Valid API Key Creation
```typescript
// Test Data
const validApiKey = {
  name: "Binance Test Account",
  exchange: "binance",
  api_key: "1234567890abcdef1234567890abcdef12345678", // 40+ chars
  secret_key: "abcdef1234567890abcdef1234567890abcdef12", // 40+ chars
  description: "Test account for development"
};

// Testing Steps:
1. Click "Add API Key" button
2. Fill form with valid data
3. Test connection (should succeed with mock data)
4. Click "Create API Key"
5. Verify success notification
6. Verify API key appears in list
```

#### Invalid API Key Creation Testing
```typescript
// Test Cases to Validate:

// 1. Empty required fields
{
  name: "", // Should show "Name is required"
  exchange: undefined, // Should show "Exchange is required"
  api_key: "", // Should show minimum length error
  secret_key: "", // Should show minimum length error
}

// 2. Invalid field lengths
{
  name: "A".repeat(51), // Should show "Name must be 50 characters or less"
  api_key: "short", // Should show "API key must be at least 32 characters"
  secret_key: "short", // Should show "Secret key must be at least 32 characters"
  description: "A".repeat(201), // Should show "Description must be 200 characters or less"
}

// 3. Connection test failure
{
  name: "Valid Name",
  exchange: "binance",
  api_key: "invalid_key_1234567890abcdef1234567890", // Valid length but invalid credentials
  secret_key: "invalid_secret_1234567890abcdef1234567890",
  description: "Test"
}
// Expected: Connection test fails, form submission blocked
```

### 3. Connection Testing

#### Successful Connection Test
```bash
# Steps:
1. Enter valid API credentials in form
2. Click "Test Connection" button
3. Wait for response (should show loading spinner)
4. Verify success message with connection details:
   - Account type information
   - Available permissions
   - Rate limiting information
```

#### Failed Connection Test
```bash
# Steps:
1. Enter invalid API credentials
2. Click "Test Connection" button  
3. Verify failure message appears
4. Verify form submission is blocked until successful test
5. Check that error doesn't expose sensitive information
```

### 4. API Key List and Filtering

#### Search Functionality
```bash
# Test Cases:
1. Search by API key name: "Binance" → Should filter matching keys
2. Search by exchange: "hitbtc" → Should show only HitBTC keys
3. Search by description: "main" → Should show keys with "main" in description
4. Empty search: "" → Should show all keys
5. No matches: "nonexistent" → Should show "No API keys found" message
```

#### Status Filtering
```bash
# Test Cases:
1. Filter by Active status → Should show only active keys
2. Filter by Inactive status → Should show only inactive keys  
3. Filter by Error status → Should show only keys with errors
4. Multiple status filters → Should show keys matching any selected status
5. Clear filters → Should show all keys
```

#### Exchange Filtering
```bash
# Test Cases:
1. Filter by Binance → Should show only Binance keys
2. Filter by HitBTC → Should show only HitBTC keys
3. Multiple exchange filters → Should show keys from selected exchanges
4. Combine with status filters → Should show intersection of filters
```

#### Sorting Functionality
```bash
# Test Cases:
1. Sort by Name (A-Z) → Alphabetical order
2. Sort by Name (Z-A) → Reverse alphabetical order
3. Sort by Created Date (Newest first) → Most recent first
4. Sort by Created Date (Oldest first) → Oldest first  
5. Sort by Last Used (Recent first) → Most recently used first
6. Sort by Last Used (Oldest first) → Least recently used first
```

### 5. API Key Editing

#### Valid Edit Operations
```bash
# Test Cases:
1. Change API key name → Should update successfully
2. Change description → Should update successfully  
3. Clear description → Should save empty description
4. Update with same data → Should show success without changes
```

#### Invalid Edit Operations
```bash
# Test Cases:
1. Empty name field → Should show validation error
2. Name too long (51+ chars) → Should show length error
3. Description too long (201+ chars) → Should show length error
4. Network error during save → Should show error notification
```

### 6. API Key Deletion

#### Safe Deletion
```bash
# Prerequisites: API key has no active positions
# Steps:
1. Click delete action from dropdown menu
2. Confirm deletion in alert dialog
3. Verify success notification
4. Verify API key removed from list
```

#### Protected Deletion
```bash
# Prerequisites: API key has active positions
# Steps:
1. Click delete action from dropdown menu
2. Verify warning message about active positions
3. Verify delete button is disabled
4. Verify position count is displayed
5. Cancel operation
```

### 7. Responsive Design Testing

#### Layout Switching
```bash
# Test at different screen sizes:
1. Desktop (1200px+): Table layout with all columns
2. Tablet (768px-1199px): Condensed table or card layout
3. Mobile (320px-767px): Card layout with stacked information

# Verify:
- No horizontal scrolling
- All information remains accessible
- Touch targets are appropriately sized (44px minimum)
- Text remains readable at all sizes
```

#### Touch Interface Testing
```bash
# On touch devices:
1. Tap to open action menus
2. Swipe gestures (if applicable)
3. Form input with virtual keyboard
4. Modal interactions with touch
5. Filter dropdown interactions
```

### 8. Error Handling Testing

#### Network Error Scenarios
```bash
# Simulate network conditions:
1. Offline mode → Should show appropriate error messages
2. Slow network → Should show loading states appropriately
3. Server errors (500) → Should show user-friendly error messages
4. Authentication errors (401) → Should redirect to login (when implemented)
5. Permission errors (403) → Should show access denied message
```

#### Form Validation Edge Cases
```bash
# Test boundary conditions:
1. Exactly 32 character API key → Should be valid
2. Exactly 31 character API key → Should show error
3. Exactly 50 character name → Should be valid  
4. Exactly 51 character name → Should show error
5. Special characters in fields → Should handle appropriately
6. Unicode characters → Should handle properly
```

### 9. Performance Testing

#### Large Dataset Testing
```bash
# Test with many API keys:
1. Load page with 100+ API keys
2. Search with large dataset → Should be instant
3. Filter operations → Should be fast
4. Scroll performance in table/card views
5. Memory usage during long usage sessions
```

#### Concurrent Operations
```bash
# Test multiple simultaneous operations:
1. Create API key while another is being tested
2. Delete API key while list is being filtered
3. Multiple rapid filter changes
4. Quick navigation between pages during operations
```

## Browser Compatibility Testing

### Required Browsers
- ✅ Chrome 90+ (Primary)
- ✅ Firefox 88+ 
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile Browsers
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Firefox Mobile
- ✅ Samsung Internet

## Accessibility Testing

### Keyboard Navigation
```bash
# Test keyboard-only navigation:
1. Tab through all interactive elements
2. Use arrow keys in dropdown menus
3. Press Enter to activate buttons
4. Press Escape to close modals
5. Use Space to toggle checkboxes
```

### Screen Reader Testing
```bash
# Test with screen reader:
1. Page structure is announced correctly
2. Form labels are properly associated
3. Error messages are announced
4. Loading states are announced
5. Success/error notifications are announced
```

### Color and Contrast
```bash
# Test accessibility features:
1. Sufficient color contrast ratios
2. Information not conveyed by color alone
3. Focus indicators visible and clear
4. Text remains readable when zoomed to 200%
```

## Development Testing

### TypeScript Compliance
```bash
# Verify TypeScript setup:
npm run type-check
# Should show no TypeScript errors
```

### Linting and Formatting
```bash
# Run code quality checks:
npm run lint
npm run format:check
# Should show no linting errors or formatting issues
```

### Build Testing
```bash
# Test production build:
npm run build
npm run preview
# Should build successfully and run in production mode
```

## Expected Test Results

### Performance Benchmarks
- **Page Load**: < 2 seconds on 3G network
- **Search Response**: < 100ms for client-side filtering
- **API Operations**: < 5 seconds including server response
- **Layout Switch**: < 200ms responsive transition

### Functional Requirements
- **CRUD Operations**: 100% functional with proper error handling
- **Form Validation**: All edge cases handled appropriately
- **Responsive Design**: Functional on all target screen sizes
- **Accessibility**: Meets WCAG 2.1 AA compliance standards

### Security Requirements
- **Data Protection**: No sensitive data exposed in UI or errors
- **Input Validation**: All user inputs properly validated
- **Error Handling**: Generic error messages prevent information disclosure
- **Connection Testing**: Validates credentials before storage

## Troubleshooting

### Common Issues and Solutions

#### Layout Issues
```bash
# Problem: Table doesn't switch to cards on mobile
# Solution: Check CSS breakpoints and responsive logic

# Problem: Filter controls overlap on small screens  
# Solution: Verify responsive flex/grid layouts
```

#### Form Issues
```bash
# Problem: Connection test always fails
# Solution: Check API endpoint configuration and mock data

# Problem: Form validation doesn't trigger
# Solution: Verify Zod schema setup and React Hook Form integration
```

#### State Management Issues
```bash
# Problem: Filters don't persist across page navigation
# Solution: Check Zustand persistence configuration

# Problem: API data doesn't update after CRUD operations
# Solution: Verify RTK Query cache invalidation tags
```

This comprehensive testing guide ensures the API Key Management Interface meets all requirements and provides a robust, secure, and user-friendly experience across all supported platforms and use cases.
