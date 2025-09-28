import React, { useState } from 'react';
import { AuthHeader, AuthFooter, LoginForm, ForgotPasswordForm } from './components';

/**
 * Main login page with form switching
 */
export default function LoginPage(){
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/20" />
      
      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <AuthHeader />
          
          {showForgotPassword ? (
            <ForgotPasswordForm
              onBack={() => setShowForgotPassword(false)}
            />
          ) : (
            <LoginForm
              onForgotPassword={() => setShowForgotPassword(true)}
            />
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="relative py-8">
        <AuthFooter />
      </div>
    </div>
  );
};
