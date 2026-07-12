import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Table, Column } from '../ui/Table';
import { StatusBadge } from '../ui/StatusBadge';
import { Badge } from '../ui/Badge';
import type { Invoice } from '../../types';

interface InvoiceTableProps {
  invoices: Invoice[];
  loading?: boolean;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, loading }) => {
  const navigate = useNavigate();

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice',
      render: (inv) => (
        <span className="font-medium text-primary-600">{inv.invoice_number}</span>
      ),
    },
    {
      key: 'client_name',
      header: 'Client',
      render: (inv) => (
        <span className="text-gray-700">{inv.client_name || '-'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (inv) => (
        <span className="font-semibold text-gray-900">
          {inv.amount.toLocaleString('en-US', {
            style: 'currency',
            currency: inv.currency,
          })}
        </span>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (inv) => (
        <Badge variant="neutral">{inv.currency}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (inv) => (
        <span className="text-gray-500">
          {format(new Date(inv.due_date), 'MMM dd, yyyy')}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <Table
        columns={columns}
        data={invoices}
        loading={loading}
        emptyMessage="No invoices match your filters."
        onRowClick={(inv) => navigate(`/invoices/${inv.id}`)}
        keyExtractor={(inv) => inv.id}
      />
    </div>
  );
};
