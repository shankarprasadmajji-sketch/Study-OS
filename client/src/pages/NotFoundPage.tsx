import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.js';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 flex items-center justify-center mb-6 shadow-sm">
        <GraduationCap className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-foreground tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-foreground mt-2">Page Not Found</h2>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
        The academic resource or route you requested could not be found. Check the URL or return to your dashboard.
      </p>
      <Link to="/app/dashboard">
        <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
