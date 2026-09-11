/**
 * @lightweight-ts/orm
 * 
 * A lightweight, type-safe TypeScript ORM for serverless PostgreSQL databases.
 * 
 * @example
 * ```typescript
 * import { defineModel, number, string, boolean, createDatabase } from '@lightweight-ts/orm';
 * 
 * const Todo = defineModel('todo', {
 *   id: number(),
 *   title: string(),
 *   completed: boolean(),
 * });
 * 
 * const db = createDatabase({
 *   connectionString: process.env.DATABASE_URL,
 *   models: { todo: Todo },
 * });
 * 
 * await db.todo.create({ title: 'Test', completed: false });
 * const todos = await db.todo.findMany({ where: { completed: false } });
 * ```
 */

// Public API exports - Schema Definition
export { number, string, boolean } from './types.js';
export type { ColumnType, Schema, InferModelType } from './types.js';

export { defineModel } from './schema.js';
export type { ModelDefinition } from './schema.js';

// Public API exports - Database
export { createDatabase } from './database.js';
export type { Database, DatabaseOptions, ModelsConfig } from './database.js';

// Public API exports - Database Configuration
export type { DatabaseConfig } from './client.js';

// Public API exports - Model API types (for type annotations)
export type { FindManyOptions, UpdateOptions, DeleteOptions } from './model.js';

// Internal modules (QueryBuilder, mapper, serializer, client implementation)
// are NOT exported - consumers should only use the public API above
