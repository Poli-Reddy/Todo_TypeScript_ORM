import { createDatabase } from '@lightweight-ts/orm';
import { Todo } from './models.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database instance for the Todo application
 * 
 * This demonstrates consuming the ORM through its public package API.
 */
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const db = createDatabase({
  connectionString: DATABASE_URL,
  models: {
    todo: Todo,
  },
});
