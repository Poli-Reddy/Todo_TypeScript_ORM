import type { Schema, InferModelType } from './types.js';

export interface Query {
  sql: string;
  params: any[];
}

export type WhereClause<T> = Partial<T>;

export class QueryBuilder<S extends Schema> {
  constructor(
    private readonly tableName: string,
    private readonly schema: S
  ) {}

  /** Reject unknown columns early — keeps generated SQL honest and errors clear. */
  private assertKnownFields(obj: Record<string, any>, context: string): void {
    for (const key of Object.keys(obj)) {
      if (!(key in this.schema)) {
        throw new Error(
          `Query building failed: Unknown field '${key}' not in schema (${context})`
        );
      }
    }
  }

  buildInsert(data: Partial<InferModelType<S>>): Query {
    const fields = Object.keys(data);
    if (fields.length === 0) {
      throw new Error('Query building failed: INSERT requires at least one field');
    }
    this.assertKnownFields(data as Record<string, any>, 'INSERT');
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    return { sql, params: values };
  }

  buildSelectById(id: number): Query {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    return { sql, params: [id] };
  }

  buildSelect(where?: WhereClause<InferModelType<S>>): Query {
    if (where) this.assertKnownFields(where as Record<string, any>, 'SELECT WHERE');
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map((key, i) => {
        params.push(where[key as keyof typeof where]);
        return `${key} = $${i + 1}`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    return { sql, params };
  }

  buildUpdate(where: WhereClause<InferModelType<S>>, data: Partial<InferModelType<S>>): Query {
    const dataFields = Object.keys(data);
    const whereFields0 = Object.keys(where);
    if (dataFields.length === 0) {
      throw new Error('Query building failed: UPDATE requires at least one field to set');
    }
    if (whereFields0.length === 0) {
      throw new Error('Query building failed: UPDATE requires a WHERE clause (refusing full-table update)');
    }
    this.assertKnownFields(data as Record<string, any>, 'UPDATE SET');
    this.assertKnownFields(where as Record<string, any>, 'UPDATE WHERE');
    const dataValues = Object.values(data);
    const setClause = dataFields.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    const whereFields = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereFields.map((key, i) => `${key} = $${dataFields.length + i + 1}`).join(' AND ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    return { sql, params: [...dataValues, ...whereValues] };
  }

  buildDelete(where: WhereClause<InferModelType<S>>): Query {
    const fields = Object.keys(where);
    if (fields.length === 0) {
      throw new Error('Query building failed: DELETE requires a WHERE clause (refusing full-table delete)');
    }
    this.assertKnownFields(where as Record<string, any>, 'DELETE WHERE');
    const values = Object.values(where);
    const conditions = fields.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    const sql = `DELETE FROM ${this.tableName} WHERE ${conditions} RETURNING *`;
    return { sql, params: values };
  }
}
