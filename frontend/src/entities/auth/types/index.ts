export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

// Backend response wrapper
export interface ApiResponse<T> {
  data: T;
}

// Auth response data (inside the data wrapper)
export interface AuthResponseData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// Complete auth response from backend
export interface AuthResponse {
  data: AuthResponseData;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string;
  roles: string[];
  permissions: string[];
  
  // Computed properties for frontend compatibility
  name?: string; // Will be computed from first_name + last_name
  avatar_url?: string;
  role?: 'user' | 'admin' | 'super_admin'; // Primary role from roles array
  settings?: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ru' | 'es' | 'de';
  timezone: string;
  currency: 'USD' | 'EUR' | 'RUB' | 'BTC';
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  telegram: boolean;
  in_app: boolean;
  push: boolean;
  email: boolean;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

export interface TokenRefreshResponseData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface TokenRefreshResponse {
  data: TokenRefreshResponseData;
}

export interface VerifyTokenResponse {
  data: {
    valid: boolean;
    user?: User;
    expires_at?: string;
  };
}

export interface LogoutResponse {
  data: {
    success: boolean;
    message: string;
  };
}

export interface AuthError {
  code: string;
  message: string;
  details?: string;
}

// Helper function to extract user's display name
export function getUserDisplayName(user: User): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.email;
}

// Helper function to get primary role
export function getUserPrimaryRole(user: User): 'user' | 'admin' | 'super_admin' {
  if (user.roles.includes('super_admin')) return 'super_admin';
  if (user.roles.includes('admin')) return 'admin';
  return 'user';
}

// Helper function to check if user has permission
export function userHasPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission);
}

// Helper function to check if user has role
export function userHasRole(user: User, role: string): boolean {
  return user.roles.includes(role);
}
