import React, { useState, useEffect } from 'react';

interface DevelopmentBannerProps {
  position?: 'top' | 'bottom';
  className?: string;
}

const DevelopmentBanner: React.FC<DevelopmentBannerProps> = ({ 
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Check if banner was dismissed in the last 24 hours
  useEffect(() => {
    const lastDismissed = localStorage.getItem('devBannerDismissed');
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      const now = Date.now();
      // If dismissed less than 24 hours ago, hide banner
      if (now - dismissedTime < 24 * 60 * 60 * 1000) {
        setIsVisible(false);
      } else {
        // Reset if it's been more than 24 hours
        localStorage.removeItem('devBannerDismissed');
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('devBannerDismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0'
  };

  return (
    <div className={`fixed ${positionClasses[position]} bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-1 rounded-lg bg-yellow-200 dark:bg-yellow-800">
              <svg className="h-5 w-5 text-yellow-700 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <p className="ml-2 text-sm font-medium text-yellow-700 dark:text-yellow-300 truncate">
              <span className="md:hidden">Under development</span>
              <span className="hidden md:inline">This system is currently under development. Some features may not be fully functional.</span>
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              className="ml-2 p-1 rounded-md text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              onClick={handleDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentBanner;