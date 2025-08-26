import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin ${className}`} />
  );
};

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <LoadingSpinner size="lg\" className="border-primary-200 border-t-white" />
        </div>
        <h2 className="text-xl font-semibold text-secondary-800 mb-2">Loading TalkWave</h2>
        <p className="text-secondary-600">Please wait while we set up your chat experience</p>
      </div>
    </div>
  );
};