import { OpenAPIV3 } from 'openapi-types';

export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Multi-Tenant Invoice Tracker API',
    version: '1.0.0',
    description: 'REST API for managing invoices, clients, users, and authentication across multiple tenants.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          tenant_id: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['admin', 'manager', 'user'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          client_id: { type: 'string', format: 'uuid' },
          invoice_number: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string', enum: ['USD', 'EUR'] },
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
          due_date: { type: 'string', format: 'date' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      InvoiceItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          invoice_id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          quantity: { type: 'number' },
          unit_price: { type: 'number' },
          total: { type: 'number' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['email', 'password', 'tenant_name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          tenant_name: { type: 'string' },
          tenant_currency: { type: 'string', enum: ['USD', 'EUR'], default: 'USD' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      CreateClientInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email', nullable: true },
          address: { type: 'string', nullable: true },
        },
      },
      UpdateClientInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email', nullable: true },
          address: { type: 'string', nullable: true },
        },
      },
      CreateInvoiceInput: {
        type: 'object',
        required: ['client_id', 'due_date', 'items'],
        properties: {
          client_id: { type: 'string', format: 'uuid' },
          invoice_number: { type: 'string' },
          currency: { type: 'string', enum: ['USD', 'EUR'], default: 'USD' },
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' },
          due_date: { type: 'string', format: 'date' },
          items: { type: 'array', items: { $ref: '#/components/schemas/InvoiceItemInput' }, minItems: 1 },
        },
      },
      UpdateInvoiceInput: {
        type: 'object',
        properties: {
          client_id: { type: 'string', format: 'uuid' },
          invoice_number: { type: 'string' },
          currency: { type: 'string', enum: ['USD', 'EUR'] },
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
          due_date: { type: 'string', format: 'date' },
          items: { type: 'array', items: { $ref: '#/components/schemas/InvoiceItemInput' }, minItems: 1 },
        },
      },
      InvoiceItemInput: {
        type: 'object',
        required: ['description', 'quantity', 'unit_price'],
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number', minimum: 0, exclusiveMinimum: true },
          unit_price: { type: 'number', minimum: 0 },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new tenant and admin user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: { '201': { description: 'Tenant and admin created' }, '409': { description: 'Email exists' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a refresh token for a new token pair',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { properties: { refresh_token: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'New tokens issued' }, '401': { description: 'Invalid/expired refresh token' } },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke a refresh token',
        requestBody: {
          content: { 'application/json': { schema: { properties: { refresh_token: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Logged out' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'User profile' }, '401': { description: 'Not authenticated' } },
      },
    },
    '/clients': {
      get: {
        tags: ['Clients'],
        summary: 'List all clients for the tenant',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'List of clients' } },
      },
      post: {
        tags: ['Clients'],
        summary: 'Create a new client',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateClientInput' } } },
        },
        responses: { '201': { description: 'Client created' } },
      },
    },
    '/clients/{id}': {
      patch: {
        tags: ['Clients'],
        summary: 'Update a client',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateClientInput' } } },
        },
        responses: { '200': { description: 'Client updated' }, '404': { description: 'Client not found' } },
      },
      delete: {
        tags: ['Clients'],
        summary: 'Soft-delete a client',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Client deleted' }, '404': { description: 'Client not found' } },
      },
    },
    '/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'List invoices with pagination and filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] } },
          { name: 'currency', in: 'query', schema: { type: 'string', enum: ['USD', 'EUR'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Paginated list of invoices' } },
      },
      post: {
        tags: ['Invoices'],
        summary: 'Create an invoice with line items',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateInvoiceInput' } } },
        },
        responses: { '201': { description: 'Invoice created' } },
      },
    },
    '/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        summary: 'Get a single invoice with line items',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Invoice details' }, '404': { description: 'Invoice not found' } },
      },
      put: {
        tags: ['Invoices'],
        summary: 'Update an invoice (and optionally replace items)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateInvoiceInput' } } },
        },
        responses: { '200': { description: 'Invoice updated' }, '404': { description: 'Invoice not found' } },
      },
      delete: {
        tags: ['Invoices'],
        summary: 'Soft-delete an invoice',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Invoice deleted' }, '404': { description: 'Invoice not found' } },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users in the tenant (admin only)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'List of users' }, '403': { description: 'Not authorized' } },
      },
    },
    '/users/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update a user role (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: { 'application/json': { schema: { properties: { role: { type: 'string', enum: ['admin', 'manager', 'user'] } } } } },
        },
        responses: { '200': { description: 'User updated' }, '404': { description: 'User not found' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Soft-delete a user (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'User deleted' }, '404': { description: 'User not found' } },
      },
    },
    '/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Dashboard stats' } },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'API is running' } },
      },
    },
    '/convert': {
      get: {
        tags: ['Currency'],
        summary: 'Convert between USD and EUR',
        parameters: [
          { name: 'amount', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'from', in: 'query', required: true, schema: { type: 'string', enum: ['USD', 'EUR'] } },
          { name: 'to', in: 'query', required: true, schema: { type: 'string', enum: ['USD', 'EUR'] } },
        ],
        responses: { '200': { description: 'Conversion result' } },
      },
    },
  },
};
