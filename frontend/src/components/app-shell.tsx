import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Swords, Users, Map, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../stores/auth-store';

const navItems = [
  { to: '/', icon: Map, label: 'Dashboard' },
  { to: '/rulesets', icon: BookOpen, label: 'Rulesets' },
  { to: '/campaigns', icon: Swords, label: 'Campaigns' },
  { to: '/characters', icon: Users, label: 'Characters' },
];

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-dvh bg-page text-heading">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-4 bg-surface border-b border-edge lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-label hover:text-content transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="ml-2 text-lg font-bold text-accent">RPG Manager</h1>
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-edge flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-edge">
          <h1 className="text-xl font-bold text-accent">RPG Manager</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-muted hover:text-content transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-label hover:bg-subtle hover:text-content'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-edge">
          <div className="flex items-center justify-between">
            <a
              href="/api/logs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-label hover:text-accent transition-colors"
              title="Open live logs"
            >{user?.username}</a>
            <button
              onClick={logout}
              className="text-muted hover:text-content transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — offset for mobile top bar */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
