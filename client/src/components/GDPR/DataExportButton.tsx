// =============================================================================
// Data Export Button — GDPR Right to Data Portability
// =============================================================================

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { invoiceApi, clientApi, dashboardApi } from '../../services/api';
import toast from 'react-hot-toast';

export const DataExportButton: React.FC = () => {
  const t = useTranslation();
  const { user } = useAuthStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);

    try {
      // Gather all user data in parallel
      const [invoicesRes, clientsRes, statsRes] = await Promise.all([
        invoiceApi.list({ limit: 1000 }).catch(() => ({ data: [], pagination: undefined })),
        clientApi.list().catch(() => ({ data: [] })),
        dashboardApi.stats().catch(() => ({ data: undefined })),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          tenant_id: user.tenant_id,
          role: user.role,
          created_at: user.created_at,
        },
        summary: statsRes.data || null,
        invoices: invoicesRes.data || [],
        clients: clientsRes.data || [],
        metadata: {
          generated_by: 'Invoice Tracker — GDPR Data Export',
          format_version: '1.0',
        },
      };

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-tracker-export-${user.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t.profile.exportSuccess);
    } catch (err: any) {
      toast.error(t.profile.exportError);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
    >
      <div className="p-2 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors">
        {exporting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
          {t.profile.dataExport}
        </p>
        <p className="text-xs text-gray-500">{t.profile.dataExportDesc}</p>
      </div>
      {!exporting && (
        <CheckCircle className="h-4 w-4 text-gray-300 ml-auto group-hover:text-primary-400 transition-colors" />
      )}
    </button>
  );
};
