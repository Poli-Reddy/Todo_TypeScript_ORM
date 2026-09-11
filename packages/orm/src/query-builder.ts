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

  buildInsert(data: Partial<InferModelType<S>>): Query {
    const fields = Object.keys(data);
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
    const values = Object.values(where);
    const conditions = fields.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    const sql = `DELETE FROM ${this.tableName} WHERE ${conditions} RETURNING *`;
    return { sql, params: values };
  }
}
