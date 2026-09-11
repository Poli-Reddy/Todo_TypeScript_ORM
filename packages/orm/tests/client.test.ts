import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseClient } from '../src/client.js';

/**
 * Integration tests for DatabaseClient
 * 
 * Note: These tests require a PostgreSQL database connection.
 * Skip these tests if DATABASE_URL is not set.
 */
const DATABASE_URL = process.env.DATABASE_URL;
const shouldRunIntegrationTests = !!DATABASE_URL;

describe.skipIf(!shouldRunIntegrationTests)('DatabaseClient Integration Tests', () => {
  let client: DatabaseClient;

  beforeAll(() => {
    if (DATABASE_URL) {
      client = new DatabaseClient(DATABASE_URL);
    }
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  it('should connect to database with connection string', async () => {
    const query = { sql: 'SELECT 1 as test', params: [] };
    const result = await client.executeQuery(query);
    
    expect(result).toHaveLength(1);
    expect(result[0].test).toBe(1);
  });

  it('should execute query with parameters', async () => {
    const query = { 
      sql: 'SELECT $1::text as value', 
      params: ['hello'] 
    };
    const result = await client.executeQuery(query);
    
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('hello');
  });

  it('should execute query with multiple parameters', async () => {
    const query = { 
      sql: 'SELECT $1::int as a, $2::text as b, $3::bool as c', 
      params: [42, 'test', true] 
    };
    const result = await client.executeQuery(query);
    
    expect(result).toHaveLength(1);
    expect(result[0].a).toBe(42);
    expect(result[0].b).toBe('test');
    expect(result[0].c).toBe(true);
  });

  it('should return single result with executeQuerySingle', async () => {
    const query = { sql: 'SELECT 42 as answer', params: [] };
    const result = await client.executeQuerySingle(query);
    
    expect(result).not.toBeNull();
    expect(result?.answer).toBe(42);
  });

  it('should return null when no results with executeQuerySingle', async () => {
    const query = { sql: 'SELECT 1 WHERE false', params: [] };
    const result = await client.executeQuerySingle(query);
    
    expect(result).toBeNull();
  });

  it('should throw descriptive error for invalid query', async () => {
    const query = { sql: 'SELECT * FROM nonexistent_table_xyz', params: [] };
    
    await expect(client.executeQuery(query)).rejects.toThrow(/Database query failed/);
  });

  it('should throw descriptive error with query context', async () => {
    const query = { sql: 'INVALID SQL', params: [] };
    
    try {
      await client.executeQuery(query);
      expect.fail('Should have thrown an error');
    } catch (error) {
      const errorMessage = (error as Error).message;
      expect(errorMessage).toContain('Database query failed');
      expect(errorMessage).toContain('INVALID SQL');
    }
  });
});

describe('DatabaseClient Unit Tests', () => {
  it('should accept connection string configuration', () => {
    const client = new DatabaseClient('postgresql://localhost:5432/test');
    expect(client).toBeInstanceOf(DatabaseClient);
    client.close();
  });

  it('should accept config object', () => {
    const client = new DatabaseClient({
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'user',
      password: 'password',
    });
    expect(client).toBeInstanceOf(DatabaseClient);
    client.close();
  });

  it('should provide access to underlying pool', () => {
    const client = new DatabaseClient('postgresql://localhost:5432/test');
    const pool = client.getPool();
    expect(pool).toBeDefined();
    client.close();
  });
});

// Log message if integration tests are skipped
if (!shouldRunIntegrationTests) {
  console.log('\n⚠️  Database integration tests skipped: DATABASE_URL not set\n');
}
