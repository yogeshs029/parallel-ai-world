import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-background-elevated border border-border flex items-center justify-center text-3xl">
        🧭
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight font-sans">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-text-secondary max-w-md font-sans">
        We couldn't find the page or world you were looking for. It may have been moved or removed.
      </p>
      <div className="pt-2">
        <Link to="/">
          <Button variant="primary" size="md" leftIcon={Home}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
