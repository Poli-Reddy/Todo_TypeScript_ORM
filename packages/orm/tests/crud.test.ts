import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { number, string, boolean } from '../src/types.js';
import { defineModel } from '../src/schema.js';
import { createDatabase } from '../src/database.js';

/**
 * CRUD Integration Tests
 * 
 * These tests require a PostgreSQL database connection.
 * Set DATABASE_URL environment variable to run them.
 */
const DATABASE_URL = process.env.DATABASE_URL;
const shouldRunIntegrationTests = !!DATABASE_URL;

describe.skipIf(!shouldRunIntegrationTests)('CRUD Operations Integration Tests', () => {
  const Todo = defineModel('todo_test', {
    id: number(),
    title: string(),
    completed: boolean(),
  });

  const db = DATABASE_URL ? createDatabase({
    connectionString: DATABASE_URL,
    models: { todo: Todo },
  }) : null;

  beforeAll(async () => {
    if (!db) return;
    
    // Create test table
    const client = db.getClient();
    await client.executeQuery({
      sql: `
        CREATE TABLE IF NOT EXISTS todo_test (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE
        )
      `,
      params: [],
    });
  });

  beforeEach(async () => {
    if (!db) return;
    
    // Clean table before each test
    const client = db.getClient();
    await client.executeQuery({
      sql: 'DELETE FROM todo_test',
      params: [],
    });
  });

  afterAll(async () => {
    if (!db) return;
    
    // Drop test table and close connection
    const client = db.getClient();
    await client.executeQuery({
      sql: 'DROP TABLE IF EXISTS todo_test',
      params: [],
    });
    await db.close();
  });

  describe('create', () => {
    it('should create a new record', async () => {
      if (!db) return;
      
      const created = await db.todo.create({
        title: 'Test Todo',
        completed: false,
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Test Todo');
      expect(created.completed).toBe(false);
    });

    it('should return fully typed object', async () => {
      if (!db) return;
      
      const created = await db.todo.create({
        title: 'Typed Test',
        completed: true,
      });

      // TypeScript should infer these types
      expect(typeof created.id).toBe('number');
      expect(typeof created.title).toBe('string');
      expect(typeof created.completed).toBe('boolean');
    });
  });

  describe('findById', () => {
    it('should find record by ID', async () => {
      if (!db) return;
      
      const created = await db.todo.create({
        title: 'Find Me',
        completed: false,
      });

      const found = await db.todo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Find Me');
    });

    it('should return null for non-existent ID', async () => {
      if (!db) return;
      
      const found = await db.todo.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      if (!db) return;
      
      // Create test data
      await db.todo.create({ title: 'Todo 1', completed: false });
      await db.todo.create({ title: 'Todo 2', completed: true });
      await db.todo.create({ title: 'Todo 3', completed: false });
    });

    it('should return all records when no filter', async () => {
      if (!db) return;
      
      const todos = await db.todo.findMany();

      expect(todos).toHaveLength(3);
    });

    it('should filter by completed=false', async () => {
      if (!db) return;
      
      const todos = await db.todo.findMany({
        where: { completed: false },
      });

      expect(todos).toHaveLength(2);
      expect(todos.every(t => t.completed === false)).toBe(true);
    });

    it('should filter by completed=true', async () => {
      if (!db) return;
      
      const todos = await db.todo.findMany({
        where: { completed: true },
      });

      expect(todos).toHaveLength(1);
      expect(todos[0].completed).toBe(true);
      expect(todos[0].title).toBe('Todo 2');
    });

    it('should filter by multiple conditions', async () => {
      if (!db) return;
      
      const todos = await db.todo.findMany({
        where: { 
          title: 'Todo 1',
          completed: false,
        },
      });

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Todo 1');
    });

    it('should return empty array when no matches', async () => {
      if (!db) return;
      
      const todos = await db.todo.findMany({
        where: { title: 'Does Not Exist' },
      });

      expect(todos).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      if (!db) return;
      
      const created = await db.todo.create({
        title: 'Update Me',
        completed: false,
      });

      const updated = await db.todo.update({
        where: { id: created.id },
        data: { completed: true },
      });

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe('Update Me');
      expect(updated.completed).toBe(true);
    });

    it('should update multiple fields', async () => {
      if (!db) return;
      
      const created = await db.todo.create({
        title: 'Original',
        completed: false,
      });

      const updated = await db.todo.update({
        where: { id: created.id },
        data: {
          title: 'Updated Title',
          completed: true,
        },
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.completed).toBe(true);
    });

    it('should throw error when no matching record', async () => {
      if (!db) return;
      
      await expect(
        db.todo.update({
          where: { id: 99999 },
          data: { completed: true },
        })
      ).rejects.toThrow(/No matching record found/);
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      if (!db) return;
      
      const created = await db.todo.create({
        title: 'Delete Me',
        completed: false,
      });

      const deleted = await db.todo.delete({
        where: { id: created.id },
      });

      expect(deleted.id).toBe(created.id);

      // Verify it's actually deleted
      const found = await db.todo.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when no matching record', async () => {
      if (!db) return;
      
      await expect(
        db.todo.delete({
          where: { id: 99999 },
        })
      ).rejects.toThrow(/No matching record found/);
    });
  });
});

// Log message if integration tests are skipped
if (!shouldRunIntegrationTests) {
  console.log('\n⚠️  CRUD integration tests skipped: DATABASE_URL not set\n');
}
