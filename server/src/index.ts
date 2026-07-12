// =============================================================================
// Server Entry Point
// =============================================================================

import './config/env';
import app from './app';
import { ENV } from './config/env';

const PORT = ENV.PORT;
const HOST = ENV.HOST;

const server = app.listen(PORT, HOST, () => {
  console.log(`\n============================================`);
  console.log(`  🧾 Invoice Tracker API`);
  console.log(`  Environment: ${ENV.NODE_ENV}`);
  console.log(`  Listening on: http://${HOST}:${PORT}`);
  console.log(`  Health:       http://localhost:${PORT}/api/health`);
  console.log(`============================================\n`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
