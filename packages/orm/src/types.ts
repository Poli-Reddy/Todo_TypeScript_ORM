/**
 * Core type system for the ORM
 * 
 * This module defines the fundamental building blocks for schema definition:
 * - ColumnType: A type-carrying wrapper for schema fields
 * - Field type constructors: number(), string(), boolean()
 * - Type inference utilities: InferModelType extracts TypeScript types from schema definitions
 */

/**
 * ColumnType represents a schema field with a specific TypeScript type.
 * The __type property is a phantom type used for type inference only.
 */
export interface ColumnType<T> {
  readonly __type: T;
  readonly kind: 'number' | 'string' | 'boolean';
}

/**
 * Creates a number field type.
 * 
 * @example
 * const schema = { id: number(), age: number() }
 */
export function number(): ColumnType<number> {
  return { __type: undefined as any, kind: 'number' };
}

/**
 * Creates a string field type.
 * 
 * @example
 * const schema = { name: string(), email: string() }
 */
export function string(): ColumnType<string> {
  return { __type: undefined as any, kind: 'string' };
}

/**
 * Creates a boolean field type.
 * 
 * @example
 * const schema = { completed: boolean(), active: boolean() }
 */
export function boolean(): ColumnType<boolean> {
  return { __type: undefined as any, kind: 'boolean' };
}

/**
 * Schema definition: maps field names to column types.
 */
export type Schema = {
  [key: string]: ColumnType<any>;
};

/**
 * InferModelType extracts the TypeScript type from a schema definition.
 * 
 * This uses TypeScript's mapped types and conditional types to transform:
 *   { id: ColumnType<number>, name: ColumnType<string> }
 * into:
 *   { id: number, name: string }
 * 
 * @example
 * const schema = { id: number(), name: string() };
 * type Model = InferModelType<typeof schema>; // { id: number; name: string }
 */
export type InferModelType<S extends Schema> = {
  [K in keyof S]: S[K] extends ColumnType<infer T> ? T : never;
};
