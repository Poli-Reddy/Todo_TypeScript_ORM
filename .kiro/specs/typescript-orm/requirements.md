Build the **Lightweight TypeScript ORM** according to the complete requirements document I provided.

The requirements document is the **source of truth**. Do not invent a different project and do not build an audit tool.

I want you to implement the project completely, test it, deploy the Todo application, and then audit your own implementation against every acceptance criterion.

## 1. Overall architecture

Build this as an **npm workspaces monorepo**:

```text
lightweight-ts-orm/
├── packages/
│   └── orm/
│       ├── src/
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── query-builder.ts
│       │   ├── client.ts
│       │   ├── mapper.ts
│       │   ├── serializer.ts
│       │   └── index.ts
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   └── todo-app/
│       ├── src/
│       │   ├── server.ts
│       │   ├── models.ts
│       │   └── routes.ts
│       ├── frontend/
│       ├── package.json
│       └── tsconfig.json
│
├── package.json
├── tsconfig.json
├── README.md
└── ARCHITECTURE.md
```

Use **npm workspaces** rather than unnecessarily introducing a more complicated monorepo tool.

The ORM must be a genuinely reusable package, while the Todo app must consume it through its public package API.

---

# 2. ORM public API

Design a clean developer-facing API around the required pattern:

```ts
const Todo = defineModel("todo", {
  id: number(),
  title: string(),
  completed: boolean(),
});
```

Then provide a database/client API allowing usage such as:

```ts
await db.todo.create({
  title: "Finish assignment",
  completed: false,
});
```

and:

```ts
const todos = await db.todo.findMany({
  where: {
    completed: false,
  },
});
```

The API should be minimal, readable, consistent, and strongly typed.

Do not create an unnecessarily huge ORM.

---

# 3. Schema and type system

Implement:

```ts
number()
string()
boolean()
defineModel()
```

The schema must drive TypeScript inference.

For example:

```ts
const Todo = defineModel("todo", {
  id: number(),
  title: string(),
  completed: boolean(),
});
```

must result in an inferred model approximately equivalent to:

```ts
{
  id: number;
  title: string;
  completed: boolean;
}
```

Use TypeScript generics, conditional types, mapped types, and type inference where appropriate.

The following must produce compile-time errors:

```ts
await db.todo.create({
  title: 123,
});
```

and:

```ts
await db.todo.findMany({
  where: {
    nonexistentField: true,
  },
});
```

Do not use `any` to bypass the type system.

Add inline comments explaining genuinely complex type transformations.

---

# 4. CRUD

Implement all required operations:

### Create

```ts
db.todo.create(data)
```

It must:

* Generate INSERT SQL.
* Parameterize values.
* Execute the query.
* Return the created record.

### Read by ID

```ts
db.todo.findById(id)
```

It must:

* Generate SELECT SQL.
* Include an ID WHERE clause.
* Return the record or `null`.

### Find many

```ts
db.todo.findMany()
```

must return all records.

And:

```ts
db.todo.findMany({
  where: {
    completed: false,
  },
})
```

must filter correctly.

### Update

Implement an API such as:

```ts
db.todo.update({
  where: { id: 1 },
  data: {
    completed: true,
  },
});
```

It must generate parameterized UPDATE SQL and return the updated record.

### Delete

Implement:

```ts
db.todo.delete({
  where: { id: 1 },
});
```

It must generate parameterized DELETE SQL and return an appropriate success indicator.

All input data must be type-safe.

---

# 5. Query builder

Separate the Query Builder from the Model API and database driver.

The architecture should be:

```text
Model API
    ↓
Query Builder
    ↓
SQL Generation
    ↓
Database Driver
    ↓
PostgreSQL
```

The requirements explicitly expect this separation.

Implement query generation for:

```text
INSERT
SELECT
SELECT + WHERE
UPDATE
DELETE
```

For example:

```ts
db.todo.findMany({
  where: {
    completed: false,
  },
});
```

should produce conceptually:

```sql
SELECT ...
FROM todo
WHERE completed = $1
```

with:

```ts
[false]
```

as parameters.

Never interpolate user-controlled values directly into SQL.

For multiple filters:

```ts
where: {
  completed: false,
  title: "Test"
}
```

generate:

```sql
WHERE completed = $1 AND title = $2
```

The query builder must reject/avoid invalid field references through the TypeScript API.

---

# 6. PostgreSQL connection layer

Use a standard Postgres driver.

The ORM must accept either a connection string or appropriate configuration.

Design a database abstraction so the Model API does not directly depend on the driver implementation.

The system must support Postgres-compatible serverless environments such as Neon/Supabase.

Implement appropriate connection pooling/lifecycle behavior for serverless usage.

Database errors must be surfaced with useful/descriptive errors.

Do not implement MySQL, MongoDB, SQLite, etc. unless absolutely necessary.

The assignment only requires Postgres-compatible databases.

---

# 7. Row mapping and serialization

This is a required part of the specification and must not be skipped.

Create a dedicated row mapper/serializer layer.

The flow should be:

```text
Database row
    ↓
Row Mapper
    ↓
Typed model object
```

Implement serialization:

```text
TypeScript value
    ↓
Serializer
    ↓
SQL parameter
```

The mapper should ensure database results correspond to the model schema.

Handle type mismatches gracefully.

Design and test the round-trip property:

```text
valid object
    ↓ serialize
database representation
    ↓ deserialize
object equivalent to original
```

Do not merely cast database rows using:

```ts
row as Todo
```

and call that validation.

Actually implement the required mapping/validation behavior.

---

# 8. Package boundaries

The ORM must expose a clean public API through:

```text
packages/orm/src/index.ts
```

Configure `package.json` with an explicit `exports` field.

Consumers should be able to do:

```ts
import {
  defineModel,
  number,
  string,
  boolean,
} from "@your-scope/light-orm";
```

They should NOT need:

```ts
import { QueryBuilder } from "@your-scope/light-orm/src/query-builder";
```

Internal query-builder/driver implementation details must remain internal.

Build output must contain:

```text
JavaScript
TypeScript declaration files
```

and the package must be structured so it can actually be published to npm.

---

# 9. Monorepo

Root:

```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

The ORM must live at:

```text
packages/orm
```

The Todo application must live at:

```text
apps/todo-app
```

The Todo application must import the ORM using the package name:

```ts
import { ... } from "@your-scope/light-orm";
```

It must never import ORM internals through relative paths.

The root workspace must support building and testing the project.

---

# 10. Todo application

Build a real Todo application that demonstrates the ORM.

Required operations:

* Create todo
* List todos
* Mark todo completed
* Delete todo
* Filter completed/incomplete

Every database operation must go through YOUR ORM.

Do not use raw SQL from the Todo application.

Do not use another ORM.

The Todo app is evidence that the ORM actually works in a realistic application.

---

# 11. Frontend

The Todo application MUST have a browser UI.

Use React + Vite unless there is a strong reason to choose another simple frontend.

The UI must provide:

```text
Create todo
List todos
Complete/uncomplete todo
Delete todo
Filter:
  All
  Completed
  Incomplete
```

When the page loads, existing database records must be displayed.

The UI must communicate with the backend, and the backend must use the ORM.

Architecture:

```text
Browser
   ↓
Todo API
   ↓
ORM
   ↓
PostgreSQL
```

---

# 12. Testing

Create comprehensive tests around the required functionality.

At minimum test:

### Schema

* defineModel
* number/string/boolean
* inferred model types

### Type safety

Verify invalid field names fail compilation.

Verify invalid data types fail compilation.

Use mechanisms such as `@ts-expect-error` where appropriate.

### Query builder

Test generated:

* INSERT
* SELECT
* SELECT + WHERE
* UPDATE
* DELETE

Test:

* parameters
* multiple conditions
* AND behavior
* SQL injection safety

### CRUD

Test:

* create
* findById
* findMany
* update
* delete

### Mapper/serializer

Test:

* row → model
* model → database parameters
* type mismatches
* round-trip behavior

### Integration

Test the actual ORM against PostgreSQL where practical.

### Todo

Test the complete flow:

```text
Frontend/API
→ ORM
→ PostgreSQL
→ ORM
→ response
```

Do not rely exclusively on mocks.

---

# 13. Documentation

Create a strong README.md.

It must document:

* Installation
* Setup
* Database configuration
* Running the ORM
* Running the Todo application
* ORM usage examples
* Schema definition
* CRUD
* Filtering
* Type safety
* Known limitations
* Approximate time spent
* AI tools used during development
* Deployment instructions
* Live deployed Todo URL

Also create:

```text
ARCHITECTURE.md
```

Explain:

* Package structure
* Module boundaries
* ORM design
* Model API
* TypeScript inference
* Query generation
* Query execution
* Database driver
* Row mapping
* Serialization
* Tradeoffs
* Data flow

Explicitly document:

```text
Model API
    ↓
Query Builder
    ↓
SQL Generation
    ↓
Database Driver
    ↓
PostgreSQL
```

---

# 14. Deployment

Deploy the Todo application publicly.

It must:

* Have a publicly accessible URL.
* Serve the functional frontend.
* Connect to a live Postgres-compatible database.
* Demonstrate CRUD.
* Demonstrate filtering.
* Have deployment configuration documented.

Do not claim deployment is complete until you have actually verified the live application.

---

# 15. Optional features

Do NOT prioritize these before the mandatory requirements are complete:

* Relationships
* Query chaining
* Migrations
* Transactions
* Validation layer
* Schema-generation CLI

These are bonuses.

If the mandatory implementation is stable and there is sufficient time, add one or two carefully designed bonuses.

A strong minimal ORM is preferable to a feature-heavy but poorly typed ORM.

---

# 16. Implementation priorities

Prioritize in this exact order:

```text
1. TypeScript type system
2. Schema/model API
3. Query builder
4. SQL generation
5. PostgreSQL execution
6. CRUD
7. Filtering
8. Row mapping + serialization
9. Package exports
10. Monorepo integration
11. Tests
12. Todo backend
13. Todo frontend
14. Deployment
15. Documentation
16. Optional bonuses
```

The goal is not to create the biggest ORM.

The goal is to create a **small, clean, strongly typed, maintainable ORM that genuinely satisfies the specification**.

---

# 17. Do not fake completion

Do not:

* Stub required functionality.
* Return fake database data.
* Hardcode Todo results.
* Cast everything to `any`.
* Cast arbitrary rows directly to model types.
* Hide errors.
* Pretend tests passed without running them.
* Claim deployment succeeded without checking it.
* Import internal ORM files from Todo.
* Replace the ORM with raw SQL.
* Copy an existing ORM implementation.

If you cannot implement something, explicitly identify it rather than pretending it works.

---

# 18. After implementation: perform a complete self-audit

Once the project is built, stop and inspect the entire resulting codebase.

Read every relevant file.

Compare the implementation against **all 15 requirements and every acceptance criterion** in the requirements document.

Create a table:

| Requirement | Acceptance Criterion | Status | Evidence | Problems |
| ----------- | -------------------- | ------ | -------- | -------- |

Use only these statuses:

🟢 COMPLETE & CORRECT
🟠 COMPLETE BUT INCORRECT
🟡 PARTIALLY COMPLETE / INCOMPLETE
🔴 NOT IMPLEMENTED
⚪ IMPLEMENTED BUT UNVERIFIED

Do not mark something complete merely because a function exists.

Verify actual behavior.

Then calculate:

* Mandatory requirements completed
* Mandatory requirements incomplete
* Incorrect implementations
* Unverified implementations
* Overall completeness
* Overall correctness
* Production/deployment readiness

Finally, fix all critical issues you identify and rerun the tests.

Only after that give me the final report.

**Build the actual Lightweight TypeScript ORM from the requirements document. Do not build an audit system.**
