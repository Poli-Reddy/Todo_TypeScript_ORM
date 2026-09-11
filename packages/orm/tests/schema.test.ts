import { describe, it, expect } from 'vitest';
import { number, string, boolean } from '../src/types.js';
import { defineModel } from '../src/schema.js';

describe('Schema Type System', () => {
  it('should create number field type', () => {
    const field = number();
    expect(field.kind).toBe('number');
  });

  it('should create string field type', () => {
    const field = string();
    expect(field.kind).toBe('string');
  });

  it('should create boolean field type', () => {
    const field = boolean();
    expect(field.kind).toBe('boolean');
  });

  it('should define model with correct table name and schema', () => {
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

  it('should define model with different schemas', () => {
    const User = defineModel('user', {
      id: number(),
      name: string(),
      email: string(),
      active: boolean(),
    });

    expect(User.tableName).toBe('user');
    expect(Object.keys(User.schema)).toHaveLength(4);
  });
});

// Type safety tests - these will fail at compile time if type inference is broken
describe('Type Safety Compilation Tests', () => {
  it('should infer correct model type', () => {
    const Todo = defineModel('todo', {
      id: number(),
      title: string(),
      completed: boolean(),
    });

    // This is a compile-time test - TypeScript should infer the correct type
    type TodoType = typeof Todo.__modelType;
    
    // These assignments should work:
    const validTodo: TodoType = {
      id: 1,
      title: 'Test',
      completed: false,
    };
    
    expect(validTodo.id).toBe(1);
    expect(validTodo.title).toBe('Test');
    expect(validTodo.completed).toBe(false);
  });

  // The following would fail at compile time (uncomment to verify):
  // 
  // @ts-expect-error - invalid field type
  // const invalidTodo: TodoType = {
  //   id: 1,
  //   title: 123, // Should be string, not number
  //   completed: false,
  // };
  //
  // @ts-expect-error - missing required field
  // const incompleteTodo: TodoType = {
  //   id: 1,
  //   title: 'Test',
  //   // missing 'completed'
  // };
});
