# @lightweight-ts/orm

A minimal, type-safe TypeScript ORM for serverless PostgreSQL (Neon, Supabase, Render).

```ts
import { defineModel, number, string, boolean, createDatabase } from '@lightweight-ts/orm';

const Todo = defineModel('todos', {
  id: number(),
  title: string(),
  completed: boolean(),
});

const db = createDatabase({
  connectionString: process.env.DATABASE_URL,
  models: { todo: Todo },
});

const created = await db.todo.create({ title: 'Learn ORM', completed: false });
const active = await db.todo.findMany({ where: { completed: false } });
const one = await db.todo.findById(1);
const updated = await db.todo.update({ where: { id: 1 }, data: { completed: true } });
await db.todo.delete({ where: { id: 1 } });
```

## Why

- Fully typed CRUD: invalid fields are compile-time errors.
- Parameterized queries only (`$1, $2…`) — no SQL interpolation of user values.
- Serverless-friendly: `pg` connection pooling + automatic SSL for managed hosts.
- Small public API (`defineModel`, `number/string/boolean`, `createDatabase` + types);
  internals (`QueryBuilder`, mapper, serializer, client) stay private.

See the repo root `README.md` and `ARCHITECTURE.md` for design, query flow,
limitations, and the Todo example app.

## Publish

```bash
npm run build --workspace=packages/orm
npm publish --workspace=packages/orm --access public
```

The demo app consumes the workspace package (`"@lightweight-ts/orm": "*"`);
after publishing, it can pin the published version instead.
