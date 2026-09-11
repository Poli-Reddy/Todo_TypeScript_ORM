import type { Schema } from './types.js';
import type { ModelDefinition } from './schema.js';
import { DatabaseClient, type DatabaseConfig } from './client.js';
import { ModelAPI } from './model.js';

/**
 * Models configuration maps model names to their definitions.
 */
export type ModelsConfig = {
  [modelName: string]: ModelDefinition<any>;
};

/**
 * Database represents a typed ORM database instance.
 * 
 * The database object provides access to model APIs through property access:
 * db.todo.create(), db.user.findMany(), etc.
 */
export type Database<M extends ModelsConfig> = {
  [K in keyof M]: M[K] extends ModelDefinition<infer S>
    ? ModelAPI<S>
    : never;
} & {
  /**
   * Close the database connection.
   * Important for graceful shutdown in serverless environments.
   */
  close(): Promise<void>;
  
  /**
   * Get the underlying database client.
   * For advanced use cases only.
   */
  getClient(): DatabaseClient;
};

/**
 * DatabaseOptions specifies the database connection and models.
 */
export interface DatabaseOptions<M extends ModelsConfig> {
  connectionString?: string;
  config?: DatabaseConfig;
  models: M;
}

/**
 * Create a database instance with typed model APIs.
 * 
 * @param options - Database connection and model definitions
 * @returns Typed database instance with model APIs
 * 
 * @example
 * const db = createDatabase({
 *   connectionString: process.env.DATABASE_URL,
 *   models: {
 *     todo: Todo,
 *     user: User,
 *   }
 * });
 * 
 * // Now you can use:
 * await db.todo.create({ ... });
 * await db.user.findMany();
 */
export function createDatabase<M extends ModelsConfig>(
  options: DatabaseOptions<M>
): Database<M> {
  // Create database client
  const config = options.connectionString || options.config;
  if (!config) {
    throw new Error('Database configuration required: provide connectionString or config');
  }
  
  const client = new DatabaseClient(config);
  
  // Create model APIs for each model
  const modelAPIs: any = {};
  
  for (const [modelName, modelDefinition] of Object.entries(options.models)) {
    modelAPIs[modelName] = new ModelAPI(modelDefinition, client);
  }
  
  // Add utility methods
  modelAPIs.close = async () => {
    await client.close();
  };
  
  modelAPIs.getClient = () => {
    return client;
  };
  
  return modelAPIs as Database<M>;
}
