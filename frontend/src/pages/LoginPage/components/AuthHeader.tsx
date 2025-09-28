import React from 'react';

/**
 * Application branding header for authentication pages
 */
export const AuthHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Spot Trading Bot
      </h1>
      <p className="text-muted-foreground mt-2">
        Smart DCA trading strategy management
      </p>
    </div>
  );
};
