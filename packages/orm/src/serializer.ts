import type { Schema, InferModelType } from './types.js';

/**
 * Serializer converts TypeScript values to SQL parameters.
 * 
 * This layer handles type conversions from TypeScript to database representations.
 */

/**
 * Serialize a model object to SQL parameter values.
 * 
 * @param data - The model data to serialize
 * @param schema - The model schema
 * @returns Object ready for SQL parameters
 * 
 * @example
 * serialize({ id: 1, title: 'Test', completed: false }, schema)
 * // Returns: { id: 1, title: 'Test', completed: false }
 */
export function serialize<S extends Schema>(
  data: Partial<InferModelType<S>>,
  schema: S
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [fieldName, value] of Object.entries(data)) {
    if (!(fieldName in schema)) {
      throw new Error(
        `Serialization failed: Unknown field '${fieldName}' not in schema`
      );
    }
    
    const columnType = schema[fieldName];
    const expectedType = columnType.kind;
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      result[fieldName] = value;
      continue;
    }
    
    // Type validation and conversion
    const actualType = typeof value;
    
    if (expectedType === 'number') {
      if (actualType !== 'number') {
        throw new Error(
          `Serialization failed: Field '${fieldName}' expected number but got ${actualType}`
        );
      }
      result[fieldName] = value;
    } else if (expectedType === 'string') {
      if (actualType !== 'string') {
        throw new Error(
          `Serialization failed: Field '${fieldName}' expected string but got ${actualType}`
        );
      }
      result[fieldName] = value;
    } else if (expectedType === 'boolean') {
      if (actualType !== 'boolean') {
        throw new Error(
          `Serialization failed: Field '${fieldName}' expected boolean but got ${actualType}`
        );
      }
      result[fieldName] = value;
    }
  }
  
  return result;
}

/**
 * Deserialize database values back to model object.
 * 
 * This is the inverse operation of serialize().
 * In most cases, database values are already in the correct format,
 * so this primarily validates types.
 * 
 * @param data - Raw database values
 * @param schema - The model schema
 * @returns Typed model object
 */
export function deserialize<S extends Schema>(
  data: Record<string, any>,
  schema: S
): InferModelType<S> {
  // Deserialization is primarily type validation
  // The mapper.ts module handles the actual row-to-model mapping
  // This function is here for symmetry and future type conversions
  
  const result: Record<string, any> = {};
  
  for (const [fieldName, columnType] of Object.entries(schema)) {
    if (!(fieldName in data)) {
      continue; // Allow partial data
    }
    
    const value = data[fieldName];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      result[fieldName] = value;
      continue;
    }
    
    const expectedType = columnType.kind;
    const actualType = typeof value;
    
    // Basic type validation
    if (expectedType === 'number' && actualType !== 'number') {
      throw new Error(
        `Deserialization failed: Field '${fieldName}' expected number but got ${actualType}`
      );
    }
    
    if (expectedType === 'string' && actualType !== 'string') {
      throw new Error(
        `Deserialization failed: Field '${fieldName}' expected string but got ${actualType}`
      );
    }
    
    if (expectedType === 'boolean' && actualType !== 'boolean') {
      throw new Error(
        `Deserialization failed: Field '${fieldName}' expected boolean but got ${actualType}`
      );
    }
    
    result[fieldName] = value;
  }
  
  return result as InferModelType<S>;
}
