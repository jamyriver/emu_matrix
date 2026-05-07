import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export function getPool(config?: PoolConfig): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ...config,
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
  return result;
}

export async function getClient() {
  const client = await getPool().connect();
  return client;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
