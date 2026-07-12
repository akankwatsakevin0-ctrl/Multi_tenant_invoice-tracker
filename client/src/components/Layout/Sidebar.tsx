import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCircle,
  Receipt,
  X,
  DollarSign,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Invoices', path: '/invoices', icon: <FileText className="h-5 w-5" /> },
  { label: 'Clients', path: '/clients', icon: <Users className="h-5 w-5" /> },
  { label: 'Profile', path: '/profile', icon: <UserCircle className="h-5 w-5" /> },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobile, onClose }) => {
  const { currency, toggleCurrency } = useUIStore();

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
    ${
      isActive
        ? 'bg-primary-50 text-primary-700 shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <aside
      className={`${
        mobile
          ? 'fixed inset-0 z-50 lg:hidden'
          : 'hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0'
      }`}
    >
      {/* Mobile backdrop */}
      {mobile && (
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      )}

      {/* Sidebar panel */}
      <nav
        className={`relative flex flex-col h-full bg-white border-r border-gray-200 ${
          mobile ? 'w-[260px] shadow-2xl' : 'w-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-600 text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">InvoiceTrack</h1>
              <p className="text-[11px] text-gray-500 -mt-0.5">Multi-Tenant</p>
            </div>
          </div>
          {mobile && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={linkClasses}
              onClick={mobile ? onClose : undefined}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Currency toggle */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium
              text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <DollarSign className="h-5 w-5" />
            <span>Display: {currency}</span>
            <span className="ml-auto text-xs text-gray-400">Toggle</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};
