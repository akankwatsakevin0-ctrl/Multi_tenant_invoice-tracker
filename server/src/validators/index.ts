import { z } from 'zod';

const currencyEnum = z.enum(['USD', 'EUR']);
const invoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  tenant_name: z.string().min(1, 'tenant_name is required.'),
  tenant_currency: currencyEnum.optional().default('USD'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required.'),
});

export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required.').trim(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  invoice_number: z.string().optional(),
  currency: currencyEnum.default('USD'),
  status: invoiceStatusEnum.optional().default('draft'),
  due_date: z.string().min(1, 'due_date is required.'),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required.'),
});

export const updateInvoiceSchema = z.object({
  client_id: z.string().uuid().optional(),
  invoice_number: z.string().optional(),
  currency: currencyEnum.optional(),
  status: invoiceStatusEnum.optional(),
  due_date: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1).optional(),
});

export const invoiceQuerySchema = z.object({
  status: invoiceStatusEnum.optional(),
  currency: currencyEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required.'),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).trim().optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const updateUserSchema = z.object({
  role: z.enum(['admin', 'manager', 'user']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
