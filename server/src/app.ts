// =============================================================================
// Express Application Setup
// =============================================================================

import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { notFound, errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import invoiceRoutes from './routes/invoices';
import clientRoutes from './routes/clients';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/users';
import { convertCurrency } from './utils/currency';
import { CurrencyCode } from './types';
import { ENV } from './config/env';
import { securityHeaders } from './middleware/securityHeaders';

// ---------------------------------------------------------------------------
// Create Express app
// ---------------------------------------------------------------------------

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.set('trust proxy', ENV.TRUST_PROXY);
app.use(helmet());
app.use(
  cors({
    origin: ENV.NODE_ENV === 'production' ? ENV.CORS_ORIGIN : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(securityHeaders);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: ENV.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Stricter rate limiter for auth routes
// ---------------------------------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts. Try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ---------------------------------------------------------------------------
// Swagger API docs
// ---------------------------------------------------------------------------

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------------------------------------------------------------------------
// Health-check
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Invoice Tracker API is running.',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Currency conversion mock endpoint (no auth required for simplicity)
// ---------------------------------------------------------------------------

app.get('/api/convert', (req, res) => {
  const { amount, from, to } = req.query as {
    amount?: string;
    from?: string;
    to?: string;
  };

  if (!amount || !from || !to) {
    res.status(400).json({
      success: false,
      error: 'Query parameters required: amount, from, to',
    });
    return;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    res.status(400).json({
      success: false,
      error: 'amount must be a non-negative number.',
    });
    return;
  }

  const fromCurrency = from.toUpperCase() as CurrencyCode;
  const toCurrency = to.toUpperCase() as CurrencyCode;

  if (!['USD', 'EUR'].includes(fromCurrency) || !['USD', 'EUR'].includes(toCurrency)) {
    res.status(400).json({
      success: false,
      error: 'Supported currencies: USD, EUR',
    });
    return;
  }

  const converted = convertCurrency(parsedAmount, fromCurrency, toCurrency);

  if (converted === null) {
    res.status(400).json({
      success: false,
      error: `Conversion from ${fromCurrency} to ${toCurrency} is not supported.`,
    });
    return;
  }

  res.json({
    success: true,
    data: {
      amount: parsedAmount,
      from: fromCurrency,
      to: toCurrency,
      result: converted,
      rate: converted / parsedAmount,
    },
  });
});

// ---------------------------------------------------------------------------
// Mount API routes
// ---------------------------------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// ---------------------------------------------------------------------------
// Serve built frontend in production
// ---------------------------------------------------------------------------

if (ENV.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

app.use(notFound);
app.use(errorHandler);

export default app;
