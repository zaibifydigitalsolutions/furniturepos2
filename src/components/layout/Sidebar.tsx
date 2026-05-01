import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getInitials } from '../../lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FolderTree, 
  Warehouse, 
  Users, 
  User, 
  Receipt, 
  BarChart3, 
  DollarSign, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
  { path: '/pos', icon: ShoppingCart, label: 'POS Billing', permission: 'pos' },
  { path: '/products', icon: Package, label: 'Products', permission: 'products' },
  { path: '/categories', icon: FolderTree, label: 'Categories', permission: 'products' },
  { path: '/inventory', icon: Warehouse, label: 'Inventory', permission: 'inventory' },
  { path: '/staff', icon: Users, label: 'Staff Management', permission: 'staff' },
  { path: '/customers', icon: User, label: 'Customers', permission: 'customers' },
  { path: '/sales', icon: Receipt, label: 'Sales History', permission: 'sales' },
  { path: '/reports', icon: BarChart3, label: 'Reports', permission: 'reports' },
  { path: '/expenses', icon: DollarSign, label: 'Expenses', permission: 'expenses' },
  { path: '/settings', icon: Settings, label: 'Settings', permission: 'settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  return (
    <div 
      className={`bg-sidebar-bg text-sidebar-text flex flex-col h-screen transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10" />
          {!collapsed && (
            <div>
              <h1 className="font-display font-bold text-lg text-accent">Abduallah</h1>
              <p className="text-xs text-sidebar-text/60">Furniture House</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            if (!hasPermission(item.permission)) return null;
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-white/10 text-accent border-l-4 border-accent'
                      : 'hover:bg-white/5 text-sidebar-text'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
            {user ? getInitials(user.name) : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-text/60 capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-150 text-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 -right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-primary hover:bg-accent-hover transition-all duration-150"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
}
