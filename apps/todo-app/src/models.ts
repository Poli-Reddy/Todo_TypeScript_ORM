import { defineModel, number, string, boolean } from '@lightweight-ts/orm';

/**
 * Todo model definition
 * 
 * Represents a todo item with:
 * - id: unique identifier
 * - title: todo description
 * - completed: whether the todo is done
 */
export const Todo = defineModel('todos', {
  id: number(),
  title: string(),
  completed: boolean(),
});
