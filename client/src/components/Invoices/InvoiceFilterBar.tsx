import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { InvoiceStatus, CurrencyCode } from '../../types';

interface InvoiceFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: InvoiceStatus | '';
  onStatusFilterChange: (value: InvoiceStatus | '') => void;
  currencyFilter: CurrencyCode | '';
  onCurrencyFilterChange: (value: CurrencyCode | '') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const statusOptions: Array<{ value: InvoiceStatus | ''; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const currencyOptions: Array<{ value: CurrencyCode | ''; label: string }> = [
  { value: '', label: 'All Currencies' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

export const InvoiceFilterBar: React.FC<InvoiceFilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  currencyFilter,
  onCurrencyFilterChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by invoice number or client..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Status filter */}
        <div className="w-full sm:w-[180px]">
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as InvoiceStatus | '')}
            options={statusOptions}
            placeholder="All Statuses"
          />
        </div>

        {/* Currency filter */}
        <div className="w-full sm:w-[160px]">
          <Select
            value={currencyFilter}
            onChange={(e) => onCurrencyFilterChange(e.target.value as CurrencyCode | '')}
            options={currencyOptions}
            placeholder="All Currencies"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} icon={<X className="h-4 w-4" />}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};
