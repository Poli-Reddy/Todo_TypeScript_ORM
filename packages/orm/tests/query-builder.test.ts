import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../src/query-builder.js';
import { number, string, boolean } from '../src/types.js';

describe('QueryBuilder', () => {
  const schema = {
    id: number(),
    title: string(),
    completed: boolean(),
  };
  
  const qb = new QueryBuilder('todo', schema);

  describe('INSERT query generation', () => {
    it('should generate INSERT SQL with all fields', () => {
      const query = qb.buildInsert({
        id: 1,
        title: 'Test Todo',
        completed: false,
      });

      expect(query.sql).toBe(
        'INSERT INTO todo (id, title, completed) VALUES ($1, $2, $3) RETURNING *'
      );
      expect(query.params).toEqual([1, 'Test Todo', false]);
    });

    it('should generate INSERT SQL with partial fields', () => {
      const query = qb.buildInsert({
        title: 'Test Todo',
        completed: false,
      });

      expect(query.sql).toBe(
        'INSERT INTO todo (title, completed) VALUES ($1, $2) RETURNING *'
      );
      expect(query.params).toEqual(['Test Todo', false]);
    });

    it('should use parameterized values (SQL injection safety)', () => {
      const maliciousInput = "'; DROP TABLE todo; --";
      const query = qb.buildInsert({
        title: maliciousInput,
        completed: false,
      });

      // The malicious input should be in params, not interpolated into SQL
      expect(query.sql).not.toContain(maliciousInput);
      expect(query.params).toContain(maliciousInput);
    });
  });

  describe('SELECT query generation', () => {
    it('should generate SELECT ALL query without WHERE', () => {
      const query = qb.buildSelect();

      expect(query.sql).toBe('SELECT * FROM todo');
      expect(query.params).toEqual([]);
    });

    it('should generate SELECT query with single WHERE condition', () => {
      const query = qb.buildSelect({ completed: false });

      expect(query.sql).toBe('SELECT * FROM todo WHERE completed = $1');
      expect(query.params).toEqual([false]);
    });

    it('should generate SELECT query with multiple WHERE conditions (AND logic)', () => {
      const query = qb.buildSelect({
        completed: false,
        title: 'Test',
      });

      expect(query.sql).toBe('SELECT * FROM todo WHERE completed = $1 AND title = $2');
      expect(query.params).toEqual([false, 'Test']);
    });

    it('should generate SELECT by ID query', () => {
      const query = qb.buildSelectById(42);

      expect(query.sql).toBe('SELECT * FROM todo WHERE id = $1');
      expect(query.params).toEqual([42]);
    });
  });

  describe('UPDATE query generation', () => {
    it('should generate UPDATE SQL with WHERE clause', () => {
      const query = qb.buildUpdate(
        { id: 1 },
        { completed: true }
      );

      expect(query.sql).toBe('UPDATE todo SET completed = $1 WHERE id = $2 RETURNING *');
      expect(query.params).toEqual([true, 1]);
    });

    it('should generate UPDATE SQL with multiple fields', () => {
      const query = qb.buildUpdate(
        { id: 1 },
        { title: 'Updated', completed: true }
      );

      expect(query.sql).toBe(
        'UPDATE todo SET title = $1, completed = $2 WHERE id = $3 RETURNING *'
      );
      expect(query.params).toEqual(['Updated', true, 1]);
    });

    it('should generate UPDATE SQL with multiple WHERE conditions', () => {
      const query = qb.buildUpdate(
        { id: 1, completed: false },
        { title: 'Updated' }
      );

      expect(query.sql).toBe(
        'UPDATE todo SET title = $1 WHERE id = $2 AND completed = $3 RETURNING *'
      );
      expect(query.params).toEqual(['Updated', 1, false]);
    });

    it('should use correct parameter numbering', () => {
      const query = qb.buildUpdate(
        { id: 5 },
        { title: 'A', completed: true }
      );

      // Data params come first ($1, $2), then where params ($3)
      expect(query.params).toEqual(['A', true, 5]);
      expect(query.sql).toContain('$1');
      expect(query.sql).toContain('$2');
      expect(query.sql).toContain('$3');
    });
  });

  describe('DELETE query generation', () => {
    it('should generate DELETE SQL with single WHERE condition', () => {
      const query = qb.buildDelete({ id: 1 });

      expect(query.sql).toBe('DELETE FROM todo WHERE id = $1 RETURNING *');
      expect(query.params).toEqual([1]);
    });

    it('should generate DELETE SQL with multiple WHERE conditions', () => {
      const query = qb.buildDelete({
        id: 1,
        completed: true,
      });

      expect(query.sql).toBe(
        'DELETE FROM todo WHERE id = $1 AND completed = $2 RETURNING *'
      );
      expect(query.params).toEqual([1, true]);
    });
  });

  describe('SQL injection safety', () => {
    it('should never interpolate user values into SQL', () => {
      const dangerousValue = "1; DROP TABLE todo; --";
      
      const insertQuery = qb.buildInsert({ title: dangerousValue, completed: false });
      expect(insertQuery.sql).not.toContain(dangerousValue);
      
      const selectQuery = qb.buildSelect({ title: dangerousValue });
      expect(selectQuery.sql).not.toContain(dangerousValue);
      
      const updateQuery = qb.buildUpdate({ id: 1 }, { title: dangerousValue });
      expect(updateQuery.sql).not.toContain(dangerousValue);
    });

    it('should reject unknown fields in WHERE clauses', () => {
      // @ts-expect-error - testing runtime guard for invalid field
      expect(() => qb.buildSelect({ nonexistent: true })).toThrow(/Unknown field/);
      // @ts-expect-error - testing runtime guard for invalid field
      expect(() => qb.buildDelete({ nope: 1 })).toThrow(/Unknown field/);
    });

    it('should refuse full-table UPDATE/DELETE and empty INSERT', () => {
      // @ts-expect-error - testing runtime guard for empty where
      expect(() => qb.buildUpdate({}, { title: 'x' })).toThrow(/WHERE clause/);
      expect(() => qb.buildUpdate({ id: 1 }, {})).toThrow(/at least one field/);
      // @ts-expect-error - testing runtime guard for empty where
      expect(() => qb.buildDelete({})).toThrow(/WHERE clause/);
      // @ts-expect-error - testing runtime guard for empty insert
      expect(() => qb.buildInsert({})).toThrow(/at least one field/);
    });

    it('should use parameterized queries for all operations', () => {
      const insertQuery = qb.buildInsert({ title: 'Test', completed: false });
      expect(insertQuery.sql).toMatch(/\$\d+/); // Contains $1, $2, etc.
      expect(insertQuery.params.length).toBeGreaterThan(0);

      const selectQuery = qb.buildSelect({ completed: false });
      expect(selectQuery.sql).toMatch(/\$\d+/);
      expect(selectQuery.params.length).toBeGreaterThan(0);

      const updateQuery = qb.buildUpdate({ id: 1 }, { title: 'Test' });
      expect(updateQuery.sql).toMatch(/\$\d+/);
      expect(updateQuery.params.length).toBeGreaterThan(0);

      const deleteQuery = qb.buildDelete({ id: 1 });
      expect(deleteQuery.sql).toMatch(/\$\d+/);
      expect(deleteQuery.params.length).toBeGreaterThan(0);
    });
  });
});
