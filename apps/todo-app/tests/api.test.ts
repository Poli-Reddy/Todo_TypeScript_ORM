import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

/**
 * Todo Backend API tests.
 *
 * These run WITHOUT a database: they cover the health endpoint and every
 * validation branch in routes.ts that responds before touching the DB
 * (invalid IDs, missing titles, empty updates). Full CRUD round-trips are
 * covered by the ORM integration tests (packages/orm, DATABASE_URL-gated)
 * plus manual runs against a real Postgres (see DEPLOYMENT.md).
 */
describe('GET /health', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /', () => {
  it('should return API info', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body.name).toBe('Todo API');
    expect(res.body.health).toBe('/health');
    expect(Array.isArray(res.body.endpoints)).toBe(true);
  });

  it('should 404 unknown routes as JSON', async () => {
    const res = await request(app).get('/nope').expect(404);
    expect(res.body.error).toBe('Not found');
  });
});

describe('Todo route validation (no DB required)', () => {
  it('GET /api/todos/:id should 400 on non-numeric id', async () => {
    const res = await request(app).get('/api/todos/abc').expect(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/todos should 400 when title is missing', async () => {
    const res = await request(app).post('/api/todos').send({}).expect(400);
    expect(res.body.error).toMatch(/Title is required/);
  });

  it('POST /api/todos should 400 when title is blank', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' }).expect(400);
    expect(res.body.error).toMatch(/Title cannot be empty/);
  });

  it('PUT /api/todos/:id should 400 on non-numeric id', async () => {
    const res = await request(app).put('/api/todos/abc').send({ completed: true }).expect(400);
    expect(res.body.error).toBeDefined();
  });

  it('PUT /api/todos/:id should 400 when no updates provided', async () => {
    const res = await request(app).put('/api/todos/1').send({}).expect(400);
    expect(res.body.error).toMatch(/No updates provided/);
  });

  it('DELETE /api/todos/:id should 400 on non-numeric id', async () => {
    const res = await request(app).delete('/api/todos/abc').expect(400);
    expect(res.body.error).toBeDefined();
  });
});
