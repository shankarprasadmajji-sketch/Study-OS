import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Sparkles,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { EditProfileModal } from '../profile/EditProfileModal.js';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Close dropdown whenever route changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/app/dashboard')) return 'Dashboard Overview';
    if (pathname.includes('/app/subjects')) return 'Subjects & Syllabus';
    if (pathname.includes('/app/topics')) return 'Syllabus Topics';
    if (pathname.includes('/app/timetable')) return 'Timetable & Daily Schedule';
    if (pathname.includes('/app/study-plan')) return 'Study Plan Engine';
    if (pathname.includes('/app/progress')) return 'Progress Analytics';
    if (pathname.includes('/app/focus')) return 'Focus Mode';
    if (pathname.includes('/app/profile')) return 'User Profile';
    if (pathname.includes('/app/settings')) return 'Settings & Preferences';
    if (pathname.includes('/app/notes')) return 'Study Notes';
    if (pathname.includes('/app/history')) return 'Study History';
    if (pathname.includes('/app/music')) return 'Study Music Station';
    if (pathname.includes('/app/onboarding')) return 'Academic Setup';
    return 'StudyOS';
  };

  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <header className="h-16 px-4 sm:px-6 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between sticky top-0 z-30 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu trigger */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-tight truncate">
              {getPageTitle(location.pathname)}
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">{todayStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
            aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          {/* Interactive Top-Right User Profile Avatar & Dropdown */}
          <div className="relative pl-2 border-l border-border" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer group"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="User account menu"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User profile'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm group-hover:scale-105 transition-transform">
                  {userInitial}
                </div>
              )}
              <ChevronDown
                className={`w-3 h-3 text-muted-foreground hidden sm:block transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-foreground' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-card border border-border shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-text"
                role="menu"
                aria-orientation="vertical"
              >
                {/* Header User Card */}
                <div className="p-3 rounded-xl bg-muted/60 border border-border/60 mb-2">
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-sm">
                        {userInitial}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {user?.name || 'Student'}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <Badge variant="info" size="sm">
                      {user?.educationLevel || 'Undergraduate'}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {user?.academicYear || 'Year 1'}
                    </Badge>
                  </div>
                </div>

                {/* Dropdown Menu Items */}
                <div className="space-y-0.5 text-xs">
                  {/* View Full Profile */}
                  <Link
                    to="/app/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted font-medium transition-colors"
                    role="menuitem"
                  >
                    <UserIcon className="w-4 h-4 text-primary-600" />
                    <span>My Profile</span>
                  </Link>

                  {/* Edit Profile Quick Trigger */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted font-medium transition-colors text-left"
                    role="menuitem"
                  >
                    <Edit3 className="w-4 h-4 text-primary-600" />
                    <span>Edit Profile</span>
                  </button>

                  {/* Settings Link */}
                  <Link
                    to="/app/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted font-medium transition-colors"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4 text-primary-600" />
                    <span>Settings & Preferences</span>
                  </Link>

                  {/* Quick Theme Toggle in Dropdown */}
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-foreground hover:bg-muted font-medium transition-colors text-left"
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'light' ? (
                        <Moon className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span>Appearance</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground capitalize">{theme}</span>
                  </button>

                  <div className="my-1 border-t border-border" />

                  {/* Sign Out Option */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-colors text-left"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};
