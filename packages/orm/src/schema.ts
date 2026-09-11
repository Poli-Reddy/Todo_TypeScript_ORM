import type { Schema, InferModelType } from './types.js';

/**
 * ModelDefinition encapsulates a table name and its schema.
 * This is the core abstraction returned by defineModel().
 */
export interface ModelDefinition<S extends Schema> {
  readonly tableName: string;
  readonly schema: S;
  readonly __modelType: InferModelType<S>; // Phantom type for inference
}

/**
 * defineModel creates a model definition from a table name and schema.
 * 
 * This function is the primary API for defining database models.
 * It captures both the runtime schema information and TypeScript type information.
 * 
 * @param tableName - The name of the database table
 * @param schema - The schema definition mapping field names to column types
 * @returns A ModelDefinition that can be used to create a database client
 * 
 * @example
 * const Todo = defineModel("todo", {
 *   id: number(),
 *   title: string(),
 *   completed: boolean()
 * });
 * 
 * // TypeScript infers: ModelDefinition<{ id: number; title: string; completed: boolean }>
 */
export function defineModel<S extends Schema>(
  tableName: string,
  schema: S
): ModelDefinition<S> {
  return {
    tableName,
    schema,
    __modelType: undefined as any, // Phantom type, never used at runtime
  };
}
