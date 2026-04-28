import { useState, useEffect } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getInitials } from '../../lib/utils';
import { format } from 'date-fns';

export default function TopBar() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-border h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-display font-semibold text-primary">
          FurniCraft POS
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-surface-2 rounded-lg transition-colors">
          <Bell className="text-text-secondary" size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-secondary capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
            {user ? getInitials(user.name) : 'U'}
          </div>
        </div>

        {/* Date/Time */}
        <div className="hidden lg:block text-right">
          <p className="text-sm font-medium text-text-primary">
            {format(currentTime, 'HH:mm:ss')}
          </p>
          <p className="text-xs text-text-secondary">
            {format(currentTime, 'MMM dd, yyyy')}
          </p>
        </div>
      </div>
    </header>
  );
}
