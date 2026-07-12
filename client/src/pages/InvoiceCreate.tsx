import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceForm } from '../components/Invoices/InvoiceForm';
import { invoiceApi } from '../services/api';
import toast from 'react-hot-toast';

export const InvoiceCreate: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Parameters<typeof invoiceApi.create>[0]) => {
    setIsSubmitting(true);
    try {
      const res = await invoiceApi.create(data);
      toast.success('Invoice created successfully!');
      navigate(`/invoices/${res.data?.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Invoice</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new invoice for a client
          </p>
        </div>
      </div>

      <InvoiceForm onSubmit={handleSubmit as any} isSubmitting={isSubmitting} />
    </div>
  );
};
