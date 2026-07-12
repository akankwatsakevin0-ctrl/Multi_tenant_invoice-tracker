// =============================================================================
// Database connection — PostgreSQL pg Pool
// =============================================================================

import { Pool, QueryResult, QueryResultRow } from 'pg';
import { ENV } from './env';

const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : false,
  min: ENV.DB_POOL_MIN,
  max: ENV.DB_POOL_MAX,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected database pool error:', err.message);
  process.exit(-1);
});

// ---------------------------------------------------------------------------
// Typed query helper — accepts template literals with parameter injection
// ---------------------------------------------------------------------------

export async function query<T extends QueryResultRow = any>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(sql, params);
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Transaction helper
// ---------------------------------------------------------------------------

export async function transaction<T>(
  fn: (queryFn: typeof query) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // override the exported query to use the transaction client
    const txQuery = async <R extends QueryResultRow = any>(
      sql: string,
      params?: unknown[]
    ): Promise<QueryResult<R>> => {
      return client.query<R>(sql, params);
    };
    const result = await fn(txQuery);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
