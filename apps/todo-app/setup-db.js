/**
 * Database Setup Script
 * 
 * This script creates the todos table in your PostgreSQL database.
 * Run with: node apps/todo-app/setup-db.js
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function setupDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in .env file');
    console.log('\nPlease create apps/todo-app/.env with:');
    console.log('DATABASE_URL=your-postgresql-connection-string');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  console.log(`   URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('\n📝 Creating todos table...');
    await client.query(schema);
    console.log('✅ Table created successfully');

    // Verify table exists
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'todos'
    `);

    if (result.rows[0].count === '1') {
      console.log('✅ Verified: todos table exists');
      
      // Show current todos count
      const countResult = await client.query('SELECT COUNT(*) as count FROM todos');
      console.log(`📊 Current todos in database: ${countResult.rows[0].count}`);
    }

    console.log('\n🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Start backend:  npm run dev --workspace=apps/todo-app');
    console.log('2. Start frontend: cd apps/todo-app/frontend && npm run dev');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection failed. Check:');
      console.log('   - DATABASE_URL is correct in .env');
      console.log('   - Database server is running');
      console.log('   - Firewall/network allows connection');
    } else if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Authentication failed. Check:');
      console.log('   - Username and password are correct');
      console.log('   - DATABASE_URL format is: postgresql://user:password@host:port/database');
    } else {
      console.log('\n💡 Database error. Check:');
      console.log('   - Database exists');
      console.log('   - User has CREATE TABLE permissions');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
