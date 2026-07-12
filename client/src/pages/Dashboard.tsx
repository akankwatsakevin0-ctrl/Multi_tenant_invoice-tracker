import React, { useEffect, useState } from 'react';
import { FileText, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { StatusBreakdown } from '../components/Dashboard/StatusBreakdown';
import { RecentInvoicesTable } from '../components/Dashboard/RecentInvoicesTable';
import { StatsCardSkeleton } from '../components/ui/LoadingSkeleton';
import { dashboardApi } from '../services/api';
import { useUIStore } from '../store/uiStore';
import type { DashboardStats } from '../types';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { currency } = useUIStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.stats();
        if (res.data) setStats(res.data);
      } catch (err: any) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Calculate conversion factors for display
  const displayAmount = stats
    ? currency === 'EUR' && stats.currency !== 'EUR'
      ? stats.total_amount * 0.92
      : currency === 'USD' && stats.currency !== 'USD'
        ? stats.total_amount * 1.09
        : stats.total_amount
    : 0;

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your invoice activity
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Total Invoices"
              value={stats?.total_invoices ?? 0}
              icon={<FileText className="h-6 w-6" />}
              accentColor="primary"
            />
            <StatsCard
              title="Total Amount"
              value={formatCurrency(displayAmount)}
              subtitle={`Displayed in ${currency}`}
              icon={<DollarSign className="h-6 w-6" />}
              accentColor="green"
            />
            <StatsCard
              title="Paid"
              value={stats?.by_status.paid?.count ?? 0}
              subtitle={formatCurrency(stats?.by_status.paid?.amount ?? 0)}
              icon={<CheckCircle2 className="h-6 w-6" />}
              accentColor="green"
            />
            <StatsCard
              title="Overdue"
              value={stats?.by_status.overdue?.count ?? 0}
              subtitle={formatCurrency(stats?.by_status.overdue?.amount ?? 0)}
              icon={<Clock className="h-6 w-6" />}
              accentColor="red"
            />
          </>
        )}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Status breakdown */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-2 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <StatusBreakdown data={stats.by_status} currency={currency} />
          ) : null}
        </div>

        {/* Recent invoices */}
        <div className="lg:col-span-2">
          <RecentInvoicesTable
            invoices={stats?.recent_invoices ?? []}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
