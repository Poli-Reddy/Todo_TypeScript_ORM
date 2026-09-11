import type { Schema, InferModelType, ColumnType } from './types.js';

/**
 * Row mapper converts database rows to typed model objects.
 * 
 * This layer ensures database results match the model schema and handles type validation.
 * It does NOT simply cast rows (row as Model), but actually validates and maps the data.
 */

/**
 * Map a database row to a typed model object.
 * 
 * @param row - Raw database row
 * @param schema - The model schema
 * @returns Typed model object
 * @throws Error if row doesn't match schema or contains type mismatches
 */
export function mapRow<S extends Schema>(
  row: Record<string, any>,
  schema: S
): InferModelType<S> {
  const result: Record<string, any> = {};
  
  for (const [fieldName, columnType] of Object.entries(schema)) {
    if (!(fieldName in row)) {
      throw new Error(
        `Row mapping failed: Missing field '${fieldName}' in database result`
      );
    }
    
    const value = row[fieldName];
    
    // Validate type matches schema
    const expectedType = columnType.kind;
    const actualType = typeof value;
    
    // Handle null values
    if (value === null || value === undefined) {
      result[fieldName] = value;
      continue;
    }
    
    // Type validation
    if (expectedType === 'number' && actualType !== 'number') {
      throw new Error(
        `Row mapping failed: Field '${fieldName}' expected number but got ${actualType}`
      );
    }
    
    if (expectedType === 'string' && actualType !== 'string') {
      throw new Error(
        `Row mapping failed: Field '${fieldName}' expected string but got ${actualType}`
      );
    }
    
    if (expectedType === 'boolean' && actualType !== 'boolean') {
      throw new Error(
        `Row mapping failed: Field '${fieldName}' expected boolean but got ${actualType}`
      );
    }
    
    result[fieldName] = value;
  }
  
  return result as InferModelType<S>;
}

/**
 * Map multiple database rows to typed model objects.
 * 
 * @param rows - Array of raw database rows
 * @param schema - The model schema
 * @returns Array of typed model objects
 */
export function mapRows<S extends Schema>(
  rows: Record<string, any>[],
  schema: S
): InferModelType<S>[] {
  return rows.map(row => mapRow(row, schema));
}
