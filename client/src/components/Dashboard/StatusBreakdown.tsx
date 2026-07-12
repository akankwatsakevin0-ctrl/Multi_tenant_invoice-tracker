import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import type { InvoiceStatus } from '../../types';

interface StatusData {
  count: number;
  amount: number;
}

interface StatusBreakdownProps {
  data: Record<InvoiceStatus, StatusData>;
  currency: string;
}

const STATUS_ORDER: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

const STATUS_COLORS: Record<InvoiceStatus, { bar: string; bg: string }> = {
  draft: { bar: 'bg-gray-400', bg: 'bg-gray-50' },
  sent: { bar: 'bg-blue-500', bg: 'bg-blue-50' },
  paid: { bar: 'bg-green-500', bg: 'bg-green-50' },
  overdue: { bar: 'bg-red-500', bg: 'bg-red-50' },
  cancelled: { bar: 'bg-yellow-500', bg: 'bg-yellow-50' },
};

export const StatusBreakdown: React.FC<StatusBreakdownProps> = ({ data, currency }) => {
  const maxCount = Math.max(...STATUS_ORDER.map((s) => data[s]?.count || 0), 1);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Invoices by Status</h3>
      </CardHeader>

      <div className="space-y-4">
        {STATUS_ORDER.map((status) => {
          const item = data[status];
          if (!item) return null;
          const percentage = (item.count / maxCount) * 100;

          return (
            <div key={status} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.count} invoices
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: currency === 'Mixed' ? 'USD' : currency,
                    })}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status].bar}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
