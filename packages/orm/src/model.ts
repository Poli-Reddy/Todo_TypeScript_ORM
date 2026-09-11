import type { Schema, InferModelType } from './types.js';
import type { ModelDefinition } from './schema.js';
import { QueryBuilder, type WhereClause } from './query-builder.js';
import { DatabaseClient } from './client.js';
import { mapRow, mapRows } from './mapper.js';
import { serialize } from './serializer.js';

/**
 * FindManyOptions specifies optional filters for findMany queries.
 */
export interface FindManyOptions<T> {
  where?: WhereClause<T>;
}

/**
 * UpdateOptions specifies which records to update and what data to set.
 */
export interface UpdateOptions<T> {
  where: WhereClause<T>;
  data: Partial<T>;
}

/**
 * DeleteOptions specifies which records to delete.
 */
export interface DeleteOptions<T> {
  where: WhereClause<T>;
}

/**
 * ModelAPI provides CRUD operations for a specific model.
 * 
 * This is the user-facing API that developers interact with.
 * It follows the pattern: db.modelName.create(), db.modelName.findMany(), etc.
 */
export class ModelAPI<S extends Schema> {
  private queryBuilder: QueryBuilder<S>;

  constructor(
    private readonly model: ModelDefinition<S>,
    private readonly client: DatabaseClient
  ) {
    this.queryBuilder = new QueryBuilder(model.tableName, model.schema);
  }

  /**
   * Create a new record.
   * 
   * @param data - The data to insert (type-checked against model schema)
   * @returns The created record
   * 
   * @example
   * await db.todo.create({ title: 'Test', completed: false })
   */
  async create(data: Partial<InferModelType<S>>): Promise<InferModelType<S>> {
    // Serialize data to ensure type safety
    const serialized = serialize(data, this.model.schema);
    
    // Build and execute INSERT query
    const query = this.queryBuilder.buildInsert(serialized as Partial<InferModelType<S>>);
    const rows = await this.client.executeQuery(query);
    
    if (rows.length === 0) {
      throw new Error('Create operation failed: No record returned');
    }
    
    // Map database row to typed model object
    return mapRow(rows[0], this.model.schema);
  }

  /**
   * Find a single record by ID.
   * 
   * @param id - The ID to search for
   * @returns The record or null if not found
   * 
   * @example
   * await db.todo.findById(1)
   */
  async findById(id: number): Promise<InferModelType<S> | null> {
    const query = this.queryBuilder.buildSelectById(id);
    const result = await this.client.executeQuerySingle(query);
    
    if (!result) {
      return null;
    }
    
    return mapRow(result, this.model.schema);
  }

  /**
   * Find multiple records with optional filtering.
   * 
   * @param options - Optional query options (where filters)
   * @returns Array of matching records
   * 
   * @example
   * // Find all records
   * await db.todo.findMany()
   * 
   * // Find with filter
   * await db.todo.findMany({ where: { completed: false } })
   */
  async findMany(options?: FindManyOptions<InferModelType<S>>): Promise<InferModelType<S>[]> {
    const where = options?.where;
    const query = this.queryBuilder.buildSelect(where);
    const rows = await this.client.executeQuery(query);
    
    return mapRows(rows, this.model.schema);
  }

  /**
   * Update records matching the filter.
   * 
   * @param options - Where clause and data to update
   * @returns The updated record(s)
   * 
   * @example
   * await db.todo.update({
   *   where: { id: 1 },
   *   data: { completed: true }
   * })
   */
  async update(options: UpdateOptions<InferModelType<S>>): Promise<InferModelType<S>> {
    // Serialize data to ensure type safety
    const serialized = serialize(options.data, this.model.schema);
    
    // Build and execute UPDATE query
    const query = this.queryBuilder.buildUpdate(options.where, serialized as Partial<InferModelType<S>>);
    const rows = await this.client.executeQuery(query);
    
    if (rows.length === 0) {
      throw new Error('Update operation failed: No matching record found');
    }
    
    // Map database row to typed model object
    return mapRow(rows[0], this.model.schema);
  }

  /**
   * Delete records matching the filter.
   * 
   * @param options - Where clause specifying which records to delete
   * @returns The deleted record(s)
   * 
   * @example
   * await db.todo.delete({ where: { id: 1 } })
   */
  async delete(options: DeleteOptions<InferModelType<S>>): Promise<InferModelType<S>> {
    const query = this.queryBuilder.buildDelete(options.where);
    const rows = await this.client.executeQuery(query);
    
    if (rows.length === 0) {
      throw new Error('Delete operation failed: No matching record found');
    }
    
    return mapRow(rows[0], this.model.schema);
  }
}
