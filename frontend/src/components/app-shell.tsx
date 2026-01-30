import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Swords, Users, Map, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/auth-store';

const navItems = [
  { to: '/', icon: Map, label: 'Dashboard' },
  { to: '/rulesets', icon: BookOpen, label: 'Rulesets' },
  { to: '/campaigns', icon: Swords, label: 'Campaigns' },
  { to: '/characters', icon: Users, label: 'Characters' },
];

export default function AppShell() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-amber-400">RPG Manager</h1>
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
                    ? 'bg-amber-400/10 text-amber-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{user?.username}</span>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
