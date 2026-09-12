# Architecture

This document describes the design of the **Lightweight TypeScript ORM** monorepo:
`packages/orm` (reusable npm package) + `apps/todo-app` (demo backend + React frontend).

## Monorepo layout

```
lightweight-ts-orm/
├── packages/orm/          # @lightweight-ts/orm — published npm package
│   ├── src/
│   │   ├── types.ts       # ColumnType<T>, Schema, InferModelType (type layer)
│   │   ├── schema.ts      # defineModel() → ModelDefinition
│   │   ├── query-builder.ts # QueryBuilder: model ops → { sql, params }
│   │   ├── client.ts      # DatabaseClient: pg Pool wrapper + SSL
│   │   ├── mapper.ts      # DB rows → typed objects (runtime validation)
│   │   ├── serializer.ts  # TS values → SQL params (runtime validation)
│   │   ├── model.ts       # ModelAPI: create/findMany/findById/update/delete
│   │   ├── database.ts    # createDatabase() → typed Database<M>
│   │   └── index.ts       # PUBLIC API ONLY — everything else is internal
│   └── tests/             # unit + (DB-gated) integration tests
├── apps/todo-app/
│   ├── src/               # models.ts, db.ts, routes.ts, server.ts
│   └── frontend/          # React + Vite UI
```

Workspace wiring: npm workspaces (`packages/*`, `apps/*`). The Todo app imports
**only** the package entry point — `import { defineModel, ... } from '@lightweight-ts/orm'`
(`apps/todo-app/src/models.ts`, `db.ts`). No deep imports into `orm/src/*`.
`tests/public-api.test.ts` enforces this boundary (asserts `QueryBuilder`,
`mapRow`, `serialize`, `DatabaseClient`, `ModelAPI` are NOT exported).

## ORM design

**Model definition.** `defineModel(tableName, schema)` captures the table name plus a
runtime schema (`{ id: number(), title: string(), completed: boolean() }`). The
`ColumnType<T>` phantom type (`__type`) carries the TS type with zero runtime cost.

**Query execution.** `createDatabase({ connectionString, models })` builds one
`ModelAPI` per model over a shared `DatabaseClient` (a `pg` connection `Pool`,
so it works in serverless environments — Neon/Supabase/Render — with SSL enabled
for managed hosts). Each operation follows the same pipeline:

```
db.todo.findMany({ where: { completed: false } })
  → ModelAPI.findMany
    → serialize() validates input values against the schema
    → QueryBuilder.buildSelect() emits { sql, params } with $1, $2… placeholders
    → DatabaseClient.executeQuery() runs pool.query(sql, params)
    → mapRow()/mapRows() validates result rows against the schema
  → caller receives a fully typed object
```

Example generated SQL:

| Call | SQL | Params |
|---|---|---|
| `create({title, completed})` | `INSERT INTO todos (title, completed) VALUES ($1, $2) RETURNING *` | `['Task', false]` |
| `findMany({where:{completed:false}})` | `SELECT * FROM todos WHERE completed = $1` | `[false]` |
| `update({where:{id}, data:{completed}})` | `UPDATE todos SET completed = $1 WHERE id = $2 RETURNING *` | `[true, 1]` |
| `delete({where:{id}})` | `DELETE FROM todos WHERE id = $1 RETURNING *` | `[1]` |

User values **never** touch the SQL string — always `$n` params (see
`tests/query-builder.test.ts` SQL-injection cases). Table/column identifiers come
from the model definition and validated `where`/`data` keys, never raw user input.

## TypeScript design

- **Inference:** `InferModelType<S> = { [K in keyof S]: S[K] extends ColumnType<infer T> ? T : never }`
  turns `{ id: ColumnType<number> }` into `{ id: number }`. `Database<M>` maps each
  `ModelDefinition<S>` to `ModelAPI<S>`, so `db.todo.create(...)` is fully typed end to end.
- **Compile-time safety:** wrong field types (`title: 123`) and unknown `where` keys
  (`{ nonexistent: true }`) are object-literal excess-property/type errors at compile time
  (covered in `tests/schema.test.ts`).
- **Tradeoffs (deliberate):**
  - `WhereClause<T> = Partial<T>` gives equality-only `AND` filters. Rich operators
    (`gt`, `like`, `or`) would need a recursive operator type — omitted for scope.
  - Types are strict at the API boundary, but runtime `serialize`/`mapRow` still validate,
    because DB data is untrusted (`any` rows from `pg`).
  - No relation/migration/transaction types — single-table scope (see Limitations).

## Todo app flow

```
React UI (App.tsx, fetch /api/todos)
  → Express (server.ts: cors, json, /api router, /health, error middleware)
    → routes.ts (validation: 400 empty title, 409 duplicate title, 404 not found)
      → db.todo.* (ORM ModelAPI over DATABASE_URL)
        → PostgreSQL (schema.sql: todos table + idx_todos_completed)
```

The frontend uses same-origin `/api` locally (Vite proxy) and `VITE_API_URL + /api`
in production (split deploy: static frontend + Render web service backend).

## Decisions & limitations

- **Postgres only**, single-table queries, no joins/relations, no migrations
  (manual `schema.sql` / `setup-db.js`), no transactions, no `ORDER BY`/`LIMIT`/
  aggregations, no query chaining, no validation layer beyond type+presence checks.
- These match the assignment scope: minimal, clean, well-typed core over feature breadth.
  Each is a documented extension point (operator `WhereClause`, chainable builder,
  migration runner) rather than an accident.
