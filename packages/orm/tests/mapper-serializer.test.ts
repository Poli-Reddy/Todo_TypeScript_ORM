import { describe, it, expect } from 'vitest';
import { number, string, boolean } from '../src/types.js';
import { mapRow, mapRows } from '../src/mapper.js';
import { serialize, deserialize } from '../src/serializer.js';

describe('Row Mapper', () => {
  const schema = {
    id: number(),
    title: string(),
    completed: boolean(),
  };

  describe('mapRow', () => {
    it('should map valid database row to model object', () => {
      const row = { id: 1, title: 'Test', completed: false };
      const mapped = mapRow(row, schema);

      expect(mapped).toEqual({ id: 1, title: 'Test', completed: false });
    });

    it('should handle null values', () => {
      const row = { id: 1, title: null, completed: false };
      const mapped = mapRow(row, schema);

      expect(mapped.title).toBeNull();
    });

    it('should throw error for missing field', () => {
      const row = { id: 1, title: 'Test' }; // missing 'completed'

      expect(() => mapRow(row, schema)).toThrow(/Missing field 'completed'/);
    });

    it('should throw error for type mismatch - number', () => {
      const row = { id: 'not-a-number', title: 'Test', completed: false };

      expect(() => mapRow(row, schema)).toThrow(/expected number but got string/);
    });

    it('should throw error for type mismatch - string', () => {
      const row = { id: 1, title: 123, completed: false };

      expect(() => mapRow(row, schema)).toThrow(/expected string but got number/);
    });

    it('should throw error for type mismatch - boolean', () => {
      const row = { id: 1, title: 'Test', completed: 'yes' };

      expect(() => mapRow(row, schema)).toThrow(/expected boolean but got string/);
    });
  });

  describe('mapRows', () => {
    it('should map multiple rows', () => {
      const rows = [
        { id: 1, title: 'First', completed: false },
        { id: 2, title: 'Second', completed: true },
      ];
      
      const mapped = mapRows(rows, schema);

      expect(mapped).toHaveLength(2);
      expect(mapped[0]).toEqual({ id: 1, title: 'First', completed: false });
      expect(mapped[1]).toEqual({ id: 2, title: 'Second', completed: true });
    });

    it('should return empty array for empty input', () => {
      const mapped = mapRows([], schema);
      expect(mapped).toEqual([]);
    });
  });
});

describe('Serializer', () => {
  const schema = {
    id: number(),
    title: string(),
    completed: boolean(),
  };

  describe('serialize', () => {
    it('should serialize valid model data', () => {
      const data = { id: 1, title: 'Test', completed: false };
      const serialized = serialize(data, schema);

      expect(serialized).toEqual({ id: 1, title: 'Test', completed: false });
    });

    it('should serialize partial data', () => {
      const data = { title: 'Test', completed: false };
      const serialized = serialize(data, schema);

      expect(serialized).toEqual({ title: 'Test', completed: false });
    });

    it('should handle null values', () => {
      const data = { id: 1, title: null, completed: false };
      const serialized = serialize(data, schema);

      expect(serialized.title).toBeNull();
    });

    it('should throw error for unknown field', () => {
      const data = { id: 1, title: 'Test', completed: false, extra: 'field' };

      expect(() => serialize(data, schema)).toThrow(/Unknown field 'extra'/);
    });

    it('should throw error for type mismatch - number', () => {
      const data = { id: 'not-a-number', title: 'Test', completed: false };

      expect(() => serialize(data as any, schema)).toThrow(/expected number but got string/);
    });

    it('should throw error for type mismatch - string', () => {
      const data = { id: 1, title: 123, completed: false };

      expect(() => serialize(data as any, schema)).toThrow(/expected string but got number/);
    });

    it('should throw error for type mismatch - boolean', () => {
      const data = { id: 1, title: 'Test', completed: 'yes' };

      expect(() => serialize(data as any, schema)).toThrow(/expected boolean but got string/);
    });
  });

  describe('deserialize', () => {
    it('should deserialize valid data', () => {
      const data = { id: 1, title: 'Test', completed: false };
      const deserialized = deserialize(data, schema);

      expect(deserialized).toEqual({ id: 1, title: 'Test', completed: false });
    });

    it('should handle partial data', () => {
      const data = { id: 1, title: 'Test' };
      const deserialized = deserialize(data, schema);

      expect(deserialized).toEqual({ id: 1, title: 'Test' });
    });

    it('should throw error for type mismatch', () => {
      const data = { id: 'not-a-number', title: 'Test', completed: false };

      expect(() => deserialize(data, schema)).toThrow(/expected number but got string/);
    });
  });
});

describe('Property Test: Serialization Round-Trip', () => {
  /**
   * Property 1: Serialization round-trip
   * Validates: Requirements 7
   * 
   * For any valid model object, serializing then deserializing should produce equivalent object
   */
  const schema = {
    id: number(),
    title: string(),
    completed: boolean(),
  };

  it('should maintain data integrity through serialize -> deserialize cycle', () => {
    // Test with various valid model objects
    const testCases = [
      { id: 1, title: 'Test', completed: false },
      { id: 42, title: 'Another', completed: true },
      { id: 0, title: '', completed: false },
      { id: 999, title: 'Special chars: !@#$%', completed: true },
    ];

    for (const original of testCases) {
      const serialized = serialize(original, schema);
      const deserialized = deserialize(serialized, schema);

      expect(deserialized).toEqual(original);
    }
  });

  it('should maintain data integrity with partial objects', () => {
    const testCases = [
      { title: 'Test', completed: false },
      { id: 1, completed: true },
      { id: 5, title: 'Partial' },
    ];

    for (const original of testCases) {
      const serialized = serialize(original, schema);
      const deserialized = deserialize(serialized, schema);

      expect(deserialized).toEqual(original);
    }
  });

  it('should maintain data integrity with null values', () => {
    const original = { id: 1, title: null, completed: false };
    const serialized = serialize(original, schema);
    const deserialized = deserialize(serialized, schema);

    expect(deserialized).toEqual(original);
    expect(deserialized.title).toBeNull();
  });

  it('should maintain type correctness through round-trip', () => {
    const original = { id: 42, title: 'Test', completed: true };
    const serialized = serialize(original, schema);
    const deserialized = deserialize(serialized, schema);

    expect(typeof deserialized.id).toBe('number');
    expect(typeof deserialized.title).toBe('string');
    expect(typeof deserialized.completed).toBe('boolean');
    expect(deserialized).toEqual(original);
  });
});
