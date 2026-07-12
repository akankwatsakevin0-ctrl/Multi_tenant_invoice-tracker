import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  User,
  Hash,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { invoiceApi } from '../services/api';
import type { Invoice, InvoiceItem } from '../types';
import toast from 'react-hot-toast';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchInvoice = async () => {
      try {
        const res = await invoiceApi.get(id);
        if (res.data) setInvoice(res.data);
      } catch {
        toast.error('Invoice not found');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this invoice?')) return;
    setDeleting(true);
    try {
      await invoiceApi.delete(id);
      toast.success('Invoice deleted successfully.');
      navigate('/invoices');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete invoice');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="page-container">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/invoices')}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Invoices
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/invoices/${id}/edit`)}
            icon={<Edit className="h-4 w-4" />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleting}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Invoice header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoice_number}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-gray-500">
              Created {format(new Date(invoice.created_at), 'MMMM dd, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {invoice.amount.toLocaleString('en-US', {
                style: 'currency',
                currency: invoice.currency,
              })}
            </p>
            <Badge variant="neutral">{invoice.currency}</Badge>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Client</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {invoice.client_name || '-'}
              </p>
              {invoice.client_email && (
                <p className="text-xs text-gray-500 mt-0.5">{invoice.client_email}</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Due Date</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {format(new Date(invoice.due_date), 'MMMM dd, yyyy')}
              </p>
              {new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
                <p className="text-xs text-red-600 mt-0.5 font-medium">Overdue</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Invoice ID</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5 font-mono">
                {invoice.id.substring(0, 8)}...
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 text-right">
                    {item.unit_price.toLocaleString('en-US', {
                      style: 'currency',
                      currency: invoice.currency,
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                    {item.total.toLocaleString('en-US', {
                      style: 'currency',
                      currency: invoice.currency,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                  Total
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  {invoice.amount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: invoice.currency,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
