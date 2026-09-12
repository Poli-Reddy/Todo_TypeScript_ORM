import { Pool, PoolConfig } from 'pg';
import type { Query } from './query-builder.js';

/**
 * DatabaseConfig supports either a connection string or detailed configuration.
 */
export type DatabaseConfig = string | PoolConfig;

/**
 * DatabaseClient abstracts the PostgreSQL driver.
 * 
 * This layer separates the ORM from the specific database driver implementation,
 * supporting the architecture: Model API → Query Builder → SQL Generation → Database Driver → PostgreSQL
 * 
 * The client uses connection pooling for efficient resource management in serverless environments.
 */
export class DatabaseClient {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    if (typeof config === 'string') {
      // Connection string format - add SSL for managed/cloud Postgres
      // (Render, Neon, Supabase all require SSL).
      const needsSSL =
        config.includes('render.com') ||
        config.includes('neon.tech') ||
        config.includes('supabase.co') ||
        config.includes('supabase.com') ||
        config.includes('sslmode=require');
      this.pool = new Pool({
        connectionString: config,
        ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      // Config object format
      this.pool = new Pool(config);
    }

    // Handle pool errors gracefully
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  /**
   * Execute a query and return results.
   * 
   * @param query - The SQL query with parameterized values
   * @returns Array of result rows
   * 
   * @throws Error with descriptive message if query fails
   */
  async executeQuery<T = any>(query: Query): Promise<T[]> {
    try {
      const result = await this.pool.query(query.sql, query.params);
      return result.rows as T[];
    } catch (error) {
      // Surface database errors with useful context
      const dbError = error as Error;
      throw new Error(
        `Database query failed: ${dbError.message}\nSQL: ${query.sql}\nParams: ${JSON.stringify(query.params)}`
      );
    }
  }

  /**
   * Execute a query and return a single result or null.
   * 
   * @param query - The SQL query with parameterized values
   * @returns Single result row or null if not found
   */
  async executeQuerySingle<T = any>(query: Query): Promise<T | null> {
    const results = await this.executeQuery<T>(query);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Close the connection pool.
   * Important for graceful shutdown in serverless environments.
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Get the underlying pool for advanced use cases.
   * Generally not needed for normal ORM usage.
   */
  getPool(): Pool {
    return this.pool;
  }
}
