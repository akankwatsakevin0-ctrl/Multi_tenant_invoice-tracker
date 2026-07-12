import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InvoiceForm } from '../components/Invoices/InvoiceForm';
import { invoiceApi } from '../services/api';
import type { Invoice, InvoiceItem } from '../types';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export const InvoiceEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchInvoice = async () => {
      try {
        const res = await invoiceApi.get(id);
        if (res.data) setInvoice(res.data);
      } catch (err: any) {
        toast.error('Invoice not found');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await invoiceApi.update(id, data);
      toast.success('Invoice updated successfully!');
      navigate(`/invoices/${id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update invoice');
    } finally {
      setIsSubmitting(false);
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

  const initialData = {
    client_id: invoice.client_id,
    invoice_number: invoice.invoice_number,
    currency: invoice.currency,
    status: invoice.status,
    due_date: invoice.due_date.split('T')[0],
    items: invoice.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) || [],
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Invoice</h1>
          <p className="text-sm text-gray-500 mt-1">
            {invoice.invoice_number}
          </p>
        </div>
      </div>

      <InvoiceForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
