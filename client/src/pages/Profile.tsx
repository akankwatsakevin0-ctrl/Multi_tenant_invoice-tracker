import React from 'react';
import { User, Shield, Building2, Calendar, Mail, Globe, ShieldCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useTranslation } from '../hooks/useTranslation';
import { DataExportButton } from '../components/GDPR/DataExportButton';
import { DeleteAccountButton } from '../components/GDPR/DeleteAccountButton';

export const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const { currency, setCurrency } = useUIStore();
  const t = useTranslation();

  if (!user) return null;

  const roleBadgeVariant = user.role === 'admin' ? 'info' as const
    : user.role === 'manager' ? 'warning' as const
    : 'default' as const;

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* User info */}
        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-primary-50 text-primary-600">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.email}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={roleBadgeVariant}>{user.role}</Badge>
                <span className="text-sm text-gray-500">
                  ID: {user.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Tenant ID</p>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {user.tenant_id.substring(0, 8)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Display Currency</p>
                  <p className="text-xs text-gray-500">
                    All amounts will be shown in this currency
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${currency === 'USD'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  USD
                </button>
                <button
                  onClick={() => setCurrency('EUR')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${currency === 'EUR'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  EUR
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* GDPR Section */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t.profile.gdpr}</h2>
              <p className="text-xs text-gray-500">{t.profile.gdprDesc}</p>
            </div>
          </div>

          <div className="space-y-3">
            <DataExportButton />
            <DeleteAccountButton />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs">
              <a href="/privacy" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">
                {t.gdpr.privacyPolicy}
              </a>
              <a href="/terms" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">
                {t.gdpr.termsOfService}
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
