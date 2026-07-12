import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  User,
  DollarSign,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useI18nStore } from '../../store/i18nStore';
import { useTranslation } from '../../hooks/useTranslation';
import { getAvailableLanguages } from '../../i18n';
import type { LanguageCode } from '../../i18n/types';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toggleSidebar, currency, toggleCurrency } = useUIStore();
  const { language, setLanguage } = useI18nStore();
  const t = useTranslation();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const availableLanguages = getAvailableLanguages();
  const currentLang = availableLanguages.find((l) => l.code === language);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Currency Toggle */}
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title={t.currency.toggle}
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{currency}</span>
          </button>

          {/* Language Toggle */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{currentLang?.label || language}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as LanguageCode);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors
                      ${
                        language === lang.code
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications (placeholder) */}
          <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || '-'}</p>
            </div>

            <div className="p-1.5 rounded-full bg-primary-50 text-primary-600">
              <User className="h-5 w-5" />
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title={t.auth.signOut}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
