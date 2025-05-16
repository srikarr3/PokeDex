import React from 'react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">{title}</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
        {description || 'This feature is currently under construction. Check back soon!'}
      </p>
      <div className="animate-pulse">
        <svg className="w-16 h-16 text-blue-500 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
    </div>
  );
};

export default PlaceholderPage;

