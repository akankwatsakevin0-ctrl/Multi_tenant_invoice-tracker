import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { InvoiceFilterBar } from '../components/Invoices/InvoiceFilterBar';
import { InvoiceTable } from '../components/Invoices/InvoiceTable';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { invoiceApi } from '../services/api';
import type { Invoice, InvoiceFilters, InvoiceStatus, CurrencyCode } from '../types';
import toast from 'react-hot-toast';

export const Invoices: React.FC = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: 15,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 0,
  });

  // Search state (debounced)
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.list(filters);
      setInvoices(res.data);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleStatusFilter = (status: InvoiceStatus | '') => {
    setFilters((prev) => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }));
  };

  const handleCurrencyFilter = (currency: CurrencyCode | '') => {
    setFilters((prev) => ({
      ...prev,
      currency: currency || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 15 });
    setSearch('');
  };

  const hasActiveFilters = !!(filters.status || filters.currency || search);

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all invoices for your company
          </p>
        </div>
        <Button onClick={() => navigate('/invoices/new')} icon={<Plus className="h-4 w-4" />}>
          New Invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <InvoiceFilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={filters.status || ''}
          onStatusFilterChange={handleStatusFilter}
          currencyFilter={filters.currency || ''}
          onCurrencyFilterChange={handleCurrencyFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TableSkeleton rows={10} columns={6} />
        </div>
      ) : (
        <>
          <InvoiceTable invoices={invoices} />

          {/* Pagination */}
          <Pagination
            page={filters.page || 1}
            totalPages={pagination.total_pages}
            total={pagination.total}
            limit={filters.limit || 15}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};
