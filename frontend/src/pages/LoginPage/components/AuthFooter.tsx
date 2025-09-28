import React from 'react';

/**
 * Authentication page footer with links and legal information
 */
export const AuthFooter: React.FC = () => {
  return (
    <div className="text-center text-sm text-muted-foreground space-y-2">
      <div className="flex justify-center space-x-4">
        <a 
          href="/privacy" 
          className="hover:text-foreground transition-colors"
        >
          Privacy Policy
        </a>
        <a 
          href="/terms" 
          className="hover:text-foreground transition-colors"
        >
          Terms of Service
        </a>
        <a 
          href="/support" 
          className="hover:text-foreground transition-colors"
        >
          Support
        </a>
      </div>
      <p>
        © {new Date().getFullYear()} Spot Trading Bot. All rights reserved.
      </p>
    </div>
  );
};
