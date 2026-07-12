import React, { useEffect, useState } from 'react';
import { Plus, Mail, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { clientApi } from '../services/api';
import type { Client, CreateClientPayload } from '../types';
import toast from 'react-hot-toast';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState<CreateClientPayload>({
    name: '',
    email: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await clientApi.list();
      if (res.data) setClients(res.data);
    } catch (err: any) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Client name is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Invalid email format.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setCreating(true);
    try {
      const res = await clientApi.create(form);
      if (res.data) {
        setClients((prev) => [...prev, res.data!]);
        toast.success('Client created successfully!');
      }
      setModalOpen(false);
      setForm({ name: '', email: '', address: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your company's clients
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
          Add Client
        </Button>
      </div>

      {/* Client list */}
      {loading ? (
        <Card>
          <TableSkeleton rows={6} columns={4} />
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <EmptyState
            title="No clients yet"
            description="Add your first client to start creating invoices."
            actionLabel="Add Client"
            onAction={() => setModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {client.name}
                    </h3>
                  </div>
                  <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>

                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}

                {client.address && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {client.address}
                  </p>
                )}

                <p className="text-xs text-gray-400 pt-1">
                  Created {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setForm({ name: '', email: '', address: '' });
          setFormErrors({});
        }}
        title="Add New Client"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Client Name *"
            placeholder="e.g. TechStart Inc"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
          />
          <Input
            label="Email"
            type="email"
            placeholder="billing@client.com"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            error={formErrors.email}
          />
          <Input
            label="Address"
            placeholder="Street, City, Country"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Client
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
