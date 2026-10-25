import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Sun, Moon, Sparkles, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { DatabaseBadge } from './DatabaseBadge.js';
import { Button } from '../ui/Button.js';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/app/dashboard')) return 'Dashboard Overview';
    if (pathname.includes('/app/subjects')) return 'Subjects & Syllabus';
    if (pathname.includes('/app/topics')) return 'Syllabus Topics';
    if (pathname.includes('/app/timetable')) return 'Timetable & Daily Schedule';
    if (pathname.includes('/app/study-plan')) return 'Study Plan Engine';
    if (pathname.includes('/app/progress')) return 'Progress Analytics';
    if (pathname.includes('/app/focus')) return 'Focus Mode';
    if (pathname.includes('/app/settings')) return 'Settings & Preferences';
    if (pathname.includes('/app/onboarding')) return 'Academic Setup';
    return 'StudyOS';
  };

  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header className="h-16 px-6 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-foreground tracking-tight">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block">{todayStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Database Status indicator */}
        <DatabaseBadge />

        {/* Generate Plan quick link */}
        <Link to="/app/study-plan" className="hidden md:inline-flex">
          <Button size="sm" variant="outline" leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary-500" />}>
            Generate Plan
          </Button>
        </Link>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
