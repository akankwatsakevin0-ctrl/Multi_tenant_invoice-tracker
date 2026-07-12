import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { clientApi } from '../../services/api';
import type { Client, CurrencyCode, InvoiceItem, InvoiceStatus } from '../../types';
import toast from 'react-hot-toast';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceFormData {
  client_id: string;
  invoice_number: string;
  currency: CurrencyCode;
  status: InvoiceStatus;
  due_date: string;
  items: LineItem[];
}

interface InvoiceFormProps {
  initialData?: Partial<Omit<InvoiceFormData, 'items'>> & { items?: InvoiceItem[] | LineItem[] };
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<InvoiceFormData>({
    client_id: initialData?.client_id || '',
    invoice_number: initialData?.invoice_number || '',
    currency: initialData?.currency || 'USD',
    status: initialData?.status || 'draft',
    due_date: initialData?.due_date || '',
    items:
      initialData?.items?.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })) || [{ description: '', quantity: 1, unit_price: 0 }],
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await clientApi.list();
        if (res.data) setClients(res.data);
      } catch (err: any) {
        toast.error('Failed to load clients');
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  const updateField = (field: keyof InvoiceFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.client_id) newErrors.client_id = 'Please select a client.';
    if (!form.due_date) newErrors.due_date = 'Due date is required.';

    const hasValidItem = form.items.some(
      (item) => item.description.trim() && item.quantity > 0 && item.unit_price >= 0
    );
    if (!hasValidItem) newErrors.items = 'At least one valid line item is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const subtotal = form.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Fields */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            label="Client *"
            placeholder="Select a client..."
            options={clientOptions}
            value={form.client_id}
            onChange={(e) => updateField('client_id', e.target.value)}
            error={errors.client_id}
            disabled={loadingClients}
          />

          <Input
            label="Invoice Number"
            placeholder="Auto-generated if left empty"
            value={form.invoice_number}
            onChange={(e) => updateField('invoice_number', e.target.value)}
          />

          <Select
            label="Currency *"
            options={[
              { value: 'USD', label: 'USD - US Dollar' },
              { value: 'EUR', label: 'EUR - Euro' },
            ]}
            value={form.currency}
            onChange={(e) => updateField('currency', e.target.value)}
          />

          <Select
            label="Status"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'paid', label: 'Paid' },
            ]}
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
          />

          <Input
            label="Due Date *"
            type="date"
            value={form.due_date}
            onChange={(e) => updateField('due_date', e.target.value)}
            error={errors.due_date}
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
          <Button type="button" variant="secondary" size="sm" onClick={addItem} icon={<Plus className="h-4 w-4" />}>
            Add Item
          </Button>
        </div>

        {errors.items && (
          <p className="text-sm text-red-600 mb-4">{errors.items}</p>
        )}

        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1" />
        </div>

        {/* Items */}
        <div className="space-y-3">
          {form.items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 rounded-lg bg-gray-50/50 border border-gray-100"
            >
              <div className="md:col-span-5">
                <Input
                  placeholder="Description of service/product"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Unit price"
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-end h-full pt-2 md:pt-0">
                <span className="text-sm font-semibold text-gray-900">
                  {(item.quantity * item.unit_price).toLocaleString('en-US', {
                    style: 'currency',
                    currency: form.currency,
                  })}
                </span>
              </div>
              <div className="md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={form.items.length <= 1}
                  className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Subtotal */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <div className="text-right">
            <p className="text-sm text-gray-500">Subtotal</p>
            <p className="text-2xl font-bold text-gray-900">
              {subtotal.toLocaleString('en-US', {
                style: 'currency',
                currency: form.currency,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {initialData ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
};
