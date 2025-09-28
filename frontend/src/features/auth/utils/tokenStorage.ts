/**
 * Token storage utility with encryption and security features
 */

const ACCESS_TOKEN_KEY = 'trader_access_token';
const REFRESH_TOKEN_KEY = 'trader_refresh_token';
const TOKEN_EXPIRY_KEY = 'trader_token_expiry';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Simple encryption utility for localStorage tokens
 */
class TokenEncryption {
  private static readonly SECRET = 'trader_app_secret_key';

  static encrypt(data: string): string {
    // Simple XOR encryption for basic protection
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ this.SECRET.charCodeAt(i % this.SECRET.length)
      );
    }
    return btoa(encrypted);
  }

  static decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.SECRET.charCodeAt(i % this.SECRET.length)
        );
      }
      return decrypted;
    } catch {
      return '';
    }
  }
}

export class TokenManager {
  /**
   * Get access token from storage
   */
  static getAccessToken(): string | null {
    try {
      const encrypted = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!encrypted) return null;
      
      const token = TokenEncryption.decrypt(encrypted);
      
      // Check if token is expired
      if (this.isTokenExpired(token)) {
        this.clearTokens();
        return null;
      }
      
      return token;
    } catch {
      return null;
    }
  }

  /**
   * Get refresh token from storage
   */
  static getRefreshToken(): string | null {
    try {
      const encrypted = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!encrypted) return null;
      
      return TokenEncryption.decrypt(encrypted);
    } catch {
      return null;
    }
  }

  /**
   * Set both access and refresh tokens
   */
  static setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    try {
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      localStorage.setItem(ACCESS_TOKEN_KEY, TokenEncryption.encrypt(accessToken));
      localStorage.setItem(REFRESH_TOKEN_KEY, TokenEncryption.encrypt(refreshToken));
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
      
      // Schedule automatic refresh
      this.scheduleRefresh(expiresIn);
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Clear all tokens from storage
   */
  static clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    if (!token) return true;
    
    try {
      const expiryString = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryString) return true;
      
      const expiresAt = parseInt(expiryString, 10);
      const now = Date.now();
      
      // Consider token expired 5 minutes before actual expiry
      return now >= (expiresAt - 5 * 60 * 1000);
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiry(): number | null {
    try {
      const expiryString = localStorage.getItem(TOKEN_EXPIRY_KEY);
      return expiryString ? parseInt(expiryString, 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if tokens exist in storage
   */
  static hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }

  /**
   * Get all token data
   */
  static getTokenData(): TokenData | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresAt = this.getTokenExpiry();
    
    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }
    
    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  // Automatic refresh scheduling
  private static refreshTimer: NodeJS.Timeout | null = null;
  private static refreshCallback: (() => Promise<void>) | null = null;

  /**
   * Set refresh callback for automatic token refresh
   */
  static setRefreshCallback(callback: () => Promise<void>): void {
    this.refreshCallback = callback;
  }

  /**
   * Schedule automatic token refresh
   */
  static scheduleRefresh(expiresIn: number): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Schedule refresh 5 minutes before expiry
    const refreshIn = Math.max((expiresIn - 300) * 1000, 60000); // At least 1 minute
    
    this.refreshTimer = setTimeout(async () => {
      if (this.refreshCallback) {
        try {
          await this.refreshCallback();
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
        }
      }
    }, refreshIn);
  }

  /**
   * Update access token after refresh
   */
  static updateAccessToken(accessToken: string, expiresIn: number): void {
    try {
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      localStorage.setItem(ACCESS_TOKEN_KEY, TokenEncryption.encrypt(accessToken));
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
      
      // Schedule next refresh
      this.scheduleRefresh(expiresIn);
    } catch (error) {
      console.error('Failed to update access token:', error);
    }
  }
}
