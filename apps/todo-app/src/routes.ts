import { Router, Request, Response } from 'express';
import { db } from './db.js';

export const router = Router();

// Helper to parse and validate ID from params
const parseId = (id: string): number => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) throw new Error('Invalid ID');
  return parsed;
};

// Helper for error responses
const handleError = (res: Response, error: unknown, defaultMsg: string, defaultStatus = 500) => {
  console.error(defaultMsg, error);
  const message = (error as Error).message;
  
  if (message.includes('No matching record')) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  res.status(defaultStatus).json({ error: defaultMsg });
};

router.get('/todos', async (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as string | undefined;
    const where = filter === 'completed' ? { completed: true } 
                : filter === 'incomplete' ? { completed: false } 
                : undefined;
    
    const todos = await db.todo.findMany(where ? { where } : undefined);
    res.json(todos);
  } catch (error) {
    handleError(res, error, 'Failed to fetch todos');
  }
});

router.get('/todos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const todo = await db.todo.findById(id);
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(todo);
  } catch (error) {
    const status = (error as Error).message === 'Invalid ID' ? 400 : 500;
    handleError(res, error, 'Failed to fetch todo', status);
  }
});

router.post('/todos', async (req: Request, res: Response) => {
  try {
    const { title, completed = false } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const existingTodos = await db.todo.findMany({ where: { title: trimmedTitle } });
    if (existingTodos.length > 0) {
      return res.status(409).json({ 
        error: 'A todo with this title already exists',
        existingTodo: existingTodos[0]
      });
    }

    const todo = await db.todo.create({ title: trimmedTitle, completed });
    res.status(201).json(todo);
  } catch (error) {
    handleError(res, error, 'Failed to create todo');
  }
});

router.put('/todos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const { title, completed } = req.body;
    const updates: any = {};

    if (title !== undefined) updates.title = title;
    if (completed !== undefined) updates.completed = completed;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const todo = await db.todo.update({ where: { id }, data: updates });
    res.json(todo);
  } catch (error) {
    const status = (error as Error).message === 'Invalid ID' ? 400 : 500;
    handleError(res, error, 'Failed to update todo', status);
  }
});

router.delete('/todos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const todo = await db.todo.delete({ where: { id } });
    res.json(todo);
  } catch (error) {
    const status = (error as Error).message === 'Invalid ID' ? 400 : 500;
    handleError(res, error, 'Failed to delete todo', status);
  }
});
