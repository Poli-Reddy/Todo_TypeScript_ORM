import { describe, it, expect } from 'vitest';
import * as ORM from '../src/index.js';

/**
 * Public API Boundary Tests
 * 
 * These tests verify that the public API exports only what consumers should access.
 */
describe('Public API Boundaries', () => {
  it('should export schema definition functions', () => {
    expect(ORM.number).toBeDefined();
    expect(ORM.string).toBeDefined();
    expect(ORM.boolean).toBeDefined();
    expect(ORM.defineModel).toBeDefined();
  });

  it('should export database factory', () => {
    expect(ORM.createDatabase).toBeDefined();
  });

  it('should NOT export internal QueryBuilder', () => {
    // @ts-expect-error - QueryBuilder should not be in public API
    expect(ORM.QueryBuilder).toBeUndefined();
  });

  it('should NOT export internal mapper functions', () => {
    // @ts-expect-error - mapRow should not be in public API
    expect(ORM.mapRow).toBeUndefined();
    // @ts-expect-error - mapRows should not be in public API
    expect(ORM.mapRows).toBeUndefined();
  });

  it('should NOT export internal serializer functions', () => {
    // @ts-expect-error - serialize should not be in public API
    expect(ORM.serialize).toBeUndefined();
    // @ts-expect-error - deserialize should not be in public API
    expect(ORM.deserialize).toBeUndefined();
  });

  it('should NOT export DatabaseClient class directly', () => {
    // @ts-expect-error - DatabaseClient should not be in public API
    expect(ORM.DatabaseClient).toBeUndefined();
  });

  it('should NOT export ModelAPI class directly', () => {
    // @ts-expect-error - ModelAPI should not be in public API
    expect(ORM.ModelAPI).toBeUndefined();
  });

  it('should be usable through clean imports', () => {
    // This simulates how consumers will use the package
    const { defineModel, number, string, boolean, createDatabase } = ORM;

    const Todo = defineModel('todo', {
      id: number(),
      title: string(),
      completed: boolean(),
    });

    expect(Todo.tableName).toBe('todo');
    expect(Todo.schema.id.kind).toBe('number');
    expect(Todo.schema.title.kind).toBe('string');
    expect(Todo.schema.completed.kind).toBe('boolean');
  });
});
