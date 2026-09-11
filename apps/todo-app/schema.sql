-- Database schema for Todo application
-- Run this SQL on your PostgreSQL database to create the todos table

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on completed for faster filtering
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);

-- Sample data (optional)
-- INSERT INTO todos (title, completed) VALUES 
--   ('Learn TypeScript ORM', false),
--   ('Build Todo App', false),
--   ('Deploy to production', false);
