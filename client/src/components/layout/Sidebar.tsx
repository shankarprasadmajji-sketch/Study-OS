import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ListTodo,
  CalendarDays,
  Sparkles,
  BarChart3,
  Timer,
  Settings,
  GraduationCap,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Subjects', path: '/app/subjects', icon: BookOpen },
    { name: 'Topics', path: '/app/topics', icon: ListTodo },
    { name: 'Timetable', path: '/app/timetable', icon: CalendarDays },
    { name: 'Study Plan', path: '/app/study-plan', icon: Sparkles },
    { name: 'Progress', path: '/app/progress', icon: BarChart3 },
    { name: 'Focus Mode', path: '/app/focus', icon: Timer },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-card border-r border-border flex flex-col justify-between select-none">
      {/* Top Branding */}
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-foreground block">
              StudyOS
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
              Smart Academic OS
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Academic Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-950/50 dark:text-primary-300 shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.name}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card & Logout */}
      <div className="p-4 border-t border-border">
        <div className="p-3 rounded-xl bg-muted/60 border border-border/50 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.educationLevel || 'Student'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};
