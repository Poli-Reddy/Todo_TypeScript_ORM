import { useState, useEffect, useMemo } from 'react';
import './App.css';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

type Filter = 'all' | 'completed' | 'incomplete';

// In production (Render backend + Vercel/Netlify frontend), VITE_API_URL is set
// to the backend URL (https://todo-app-backend-7tm8.onrender.com, see
// .env.production). Locally it is empty, so we fall back to the Vite dev
// proxy at /api.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined || '').replace(/\/$/, '') + '/api';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCompleted = useMemo(() => todos.length > 0 && todos.every(t => t.completed), [todos]);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === 'all' ? `${API_BASE}/todos` : `${API_BASE}/todos?filter=${filter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch todos');
      setTodos(await response.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [filter]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTodoTitle.trim();
    if (!trimmed) return;

    setError(null);
    try {
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, completed: false }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This todo already exists! Please enter a different task.');
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      setNewTodoTitle('');
      await fetchTodos();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleTodo = async (id: number, completed: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!response.ok) throw new Error('Failed to update todo');
      await fetchTodos();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleAll = async () => {
    setError(null);
    try {
      await Promise.all(
        todos.map(todo =>
          fetch(`${API_BASE}/todos/${todo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !allCompleted }),
          })
        )
      );
      await fetchTodos();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete todo');
      await fetchTodos();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteAll = async () => {
    setError(null);
    try {
      await Promise.all(
        todos.map(todo =>
          fetch(`${API_BASE}/todos/${todo.id}`, { method: 'DELETE' })
        )
      );
      await fetchTodos();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Todo Application</h1>
        <p className="subtitle">Built with Lightweight TypeScript ORM</p>

        <form onSubmit={handleCreateTodo} className="todo-form">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Enter a new todo..."
            className="todo-input"
          />
          <button type="submit" className="btn btn-primary">
            Add Todo
          </button>
        </form>

        {todos.length > 0 && (
          <div className="toggle-all-container">
            <input
              type="checkbox"
              checked={allCompleted}
              onChange={handleToggleAll}
              disabled={loading}
              className="toggle-all-checkbox"
            />
            <button
              onClick={handleDeleteAll}
              className="btn btn-delete-all"
              disabled={loading}
            >
              Delete All
            </button>
          </div>
        )}

        <div className="filter-controls">
          <button
            onClick={() => setFilter('all')}
            className={`btn btn-filter ${filter === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('incomplete')}
            className={`btn btn-filter ${filter === 'incomplete' ? 'active' : ''}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`btn btn-filter ${filter === 'completed' ? 'active' : ''}`}
          >
            Completed
          </button>
        </div>

        {error && <div className="error">Error: {error}</div>}
        {loading && <div className="loading">Loading...</div>}

        {!loading && (
          <div className="todo-list">
            {todos.length === 0 ? (
              <p className="empty-message">
                {filter === 'all' 
                  ? 'No todos yet. Create one above!' 
                  : `No ${filter} todos.`}
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                >
                  <label className="todo-checkbox">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id, todo.completed)}
                    />
                    <span className="todo-title">{todo.title}</span>
                  </label>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && todos.length > 0 && (
          <div className="stats">
            {todos.length} {todos.length === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
