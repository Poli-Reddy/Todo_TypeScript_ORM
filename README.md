# Lightweight TypeScript ORM

A minimal, type-safe TypeScript ORM for serverless PostgreSQL databases. Built as part of a technical assessment to demonstrate ORM design, TypeScript type system mastery, and clean architecture.

## 🎯 Project Overview

This project consists of two main components:

1. **@lightweight-ts/orm**: A reusable npm package providing a type-safe ORM
2. **Todo Application**: A demo application showcasing the ORM in action

### Live Demo

🚀 **Frontend**: https://todo-type-script-orm-todo-app-two.vercel.app
🔗 **Backend API**: https://todo-app-backend-7tm8.onrender.com

> Step-by-step deploy guide: see [DEPLOYMENT.md](./apps/todo-app/DEPLOYMENT.md).
> Backend health check: `GET https://todo-app-backend-7tm8.onrender.com/health` → `{"status":"ok"}`.

## ✨ Features

### ORM Features
- ✅ **Type-Safe Schema Definition**: Define models with full TypeScript inference
- ✅ **CRUD Operations**: Create, read, update, and delete with compile-time safety
- ✅ **Query Filtering**: Filter records with type-checked where clauses
- ✅ **SQL Injection Protection**: All queries use parameterized values
- ✅ **Serverless Compatible**: Works with Neon, Supabase, and other serverless PostgreSQL providers
- ✅ **Clean API**: Minimal, intuitive developer experience

### Todo Application Features
- ✅ Create new todos
- ✅ List all todos
- ✅ Filter by completion status (All/Active/Completed)
- ✅ Mark todos as complete/incomplete
- ✅ Delete todos
- ✅ Responsive UI built with React + Vite

## 🏗️ Architecture

The project follows a monorepo structure using npm workspaces:

```
lightweight-ts-orm/
├── packages/
│   └── orm/                 # ORM package
│       ├── src/
│       │   ├── types.ts     # Type system
│       │   ├── schema.ts    # Model definition
│       │   ├── query-builder.ts
│       │   ├── client.ts    # Database client
│       │   ├── mapper.ts    # Row mapping
│       │   ├── serializer.ts
│       │   ├── model.ts     # CRUD operations
│       │   ├── database.ts  # Database factory
│       │   └── index.ts     # Public API
│       └── tests/
│
├── apps/
│   └── todo-app/            # Demo application
│       ├── src/
│       │   ├── models.ts    # Todo model
│       │   ├── db.ts        # Database instance
│       │   ├── routes.ts    # API routes
│       │   └── server.ts    # Express server
│       └── frontend/        # React frontend
│
├── README.md
└── ARCHITECTURE.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or serverless)

### Installation

```bash
# Clone the repository
git clone https://github.com/Poli-Reddy/Todo_TypeScript_ORM.git
cd lightweight-ts-orm

# Install dependencies
npm install

# Build the ORM package
npm run build --workspace=packages/orm
```

### Database Setup

1. Create a PostgreSQL database (using Neon, Supabase, or local PostgreSQL)

2. Create the todos table:
```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);
```

3. Set up environment variables:
```bash
cd apps/todo-app
cp .env.example .env
# Edit .env and add your DATABASE_URL
```

### Running the Todo Application

**Backend**:
```bash
npm run dev --workspace=apps/todo-app
# Server runs on http://localhost:3000
```

**Frontend**:
```bash
cd apps/todo-app/frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## 📖 ORM Usage Examples

### Define a Model

```typescript
import { defineModel, number, string, boolean } from '@lightweight-ts/orm';

const Todo = defineModel('todos', {
  id: number(),
  title: string(),
  completed: boolean(),
});
```

### Create Database Instance

```typescript
import { createDatabase } from '@lightweight-ts/orm';

const db = createDatabase({
  connectionString: process.env.DATABASE_URL,
  models: {
    todo: Todo,
  },
});
```

### CRUD Operations

**Create**:
```typescript
const todo = await db.todo.create({
  title: 'Learn TypeScript ORM',
  completed: false,
});
// TypeScript infers: { id: number; title: string; completed: boolean }
```

**Read**:
```typescript
// Find all
const todos = await db.todo.findMany();

// Find with filter
const activeTodos = await db.todo.findMany({
  where: { completed: false },
});

// Find by ID
const todo = await db.todo.findById(1);
```

**Update**:
```typescript
const updated = await db.todo.update({
  where: { id: 1 },
  data: { completed: true },
});
```

**Delete**:
```typescript
await db.todo.delete({
  where: { id: 1 },
});
```

### Type Safety

The ORM provides compile-time type checking:

```typescript
// ✅ Valid
await db.todo.create({
  title: 'Test',
  completed: false,
});

// ❌ Type error: title should be string, not number
await db.todo.create({
  title: 123,
  completed: false,
});

// ❌ Type error: nonexistent field
await db.todo.findMany({
  where: { nonexistent: true },
});
```

## 🧪 Testing

The project includes comprehensive tests:

```bash
# Run all ORM tests
npm run test --workspace=packages/orm

# Tests include:
# - Schema type system
# - Query builder (SQL generation, parameterization)
# - Database client
# - Row mapping and serialization
# - CRUD operations
# - Public API boundaries
```

## 📝 Design Decisions

### Type System
- Uses TypeScript's mapped types and conditional types for type inference
- Phantom types (`__type`) enable compile-time type safety without runtime overhead
- `InferModelType<T>` extracts TypeScript types from schema definitions

### Query Builder
- Separates query building from execution (testable without database)
- Always uses parameterized queries for SQL injection protection
- Returns `{ sql: string, params: any[] }` for transparency

### Architecture
The ORM follows a clean layered architecture:

```
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

### Package Boundaries
- Internal modules (QueryBuilder, mapper, serializer) are NOT exported
- Consumers only access the public API through `index.ts`
- Prevents tight coupling and enables internal refactoring

## 🎓 Known Limitations

- **Database Support**: PostgreSQL only (no MySQL, SQLite, MongoDB)
- **Relationships**: No foreign keys or joins (single-table queries only)
- **Migrations**: Not implemented (manual SQL required)
- **Transactions**: Not implemented
- **Query Chaining**: Not implemented (single-operation API)
- **Validation**: No built-in schema validation
- **Advanced Queries**: No GROUP BY, ORDER BY, LIMIT, or aggregations

These limitations are intentional for the scope of this assessment. The focus is on demonstrating clean API design, strong TypeScript typing, and maintainable architecture rather than feature completeness.

## ⏱️ Time Spent

Approximate time breakdown:
- Planning and design: 2 hours
- ORM core implementation: 6 hours
- Testing: 3 hours
- Todo application: 3 hours
- Documentation: 2 hours
- **Total**: ~16 hours

## 🤖 AI Tools Used

- **GitHub Copilot**: Code completion and boilerplate generation
- **ChatGPT**: Architecture review and TypeScript type system design consultation
- **Kiro AI Agent**: Full implementation assistance, testing, and documentation

All generated code was reviewed, understood, and modified to meet the requirements. The agent was able to explain all design decisions and implementation details during development.

## 📦 Production Deployment

### Option 1: Deploy to Render (Recommended)

**Backend** (Blueprint — root `render.yaml` is the source of truth):
1. Push code to GitHub
2. Render Dashboard → New → **Blueprint** → select this repo
3. It creates the `todo-app-backend` web service automatically:
   - Build Command: `npm ci && npm run build --workspace=packages/orm && npm run build --workspace=apps/todo-app`
   - Start Command: `node apps/todo-app/dist/server.js`
   - Health check: `/health`, Node pinned to 20.x
4. Add environment variable: `DATABASE_URL` (Render Postgres, Neon, or Supabase URL)
5. Create the table once: `node apps/todo-app/setup-db.js` (with `DATABASE_URL` set) or run `apps/todo-app/schema.sql`
6. Deploy, then verify `https://todo-app-backend-7tm8.onrender.com/health` → `{"status":"ok"}`

**Frontend**:
1. Set `VITE_API_URL=https://todo-app-backend-7tm8.onrender.com` (`apps/todo-app/frontend/.env.production`)
2. Build: `cd apps/todo-app/frontend && npm run build`
3. Deploy `dist` folder to:
   - Netlify: Drag & drop (or connect repo; update the `/api/*` redirect in `netlify.toml`)
   - Vercel: `vercel --prod`
   - Render Static Site

Full steps: [DEPLOYMENT.md](./apps/todo-app/DEPLOYMENT.md). Detailed design: [ARCHITECTURE.md](./ARCHITECTURE.md).

> **npm package (assignment FAQ):** the ORM is published at
> [npmjs.com/package/@lightweight-ts/orm](https://www.npmjs.com/package/@lightweight-ts/orm)
> (`@lightweight-ts/orm@1.0.1`, `latest`). The Todo app pins it (`"^1.0.1"`, resolved to
> the workspace during local/CI builds) — any outside project can
> `npm install @lightweight-ts/orm` like a normal dependency. Republish with
> `npm publish --workspace=packages/orm --access public` (requires npm auth).

### Option 2: Railway

The project includes `railway.json` for one-click deployment:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```

### Option 3: Docker

```bash
# Build image
docker build -t todo-app .

# Run
docker run -p 3000:3000 -e DATABASE_URL=your-db-url todo-app
```

### Environment Variables

Required for production:
- `DATABASE_URL`: PostgreSQL connection string (with SSL for cloud providers)
- `PORT`: Server port (default: 3000)
- `VITE_API_URL`: Backend URL (frontend only)

## 📦 Deployment

See [DEPLOYMENT.md](./apps/todo-app/DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy**:
1. Database: Create on Neon or Supabase
2. Backend: Deploy to Render or Railway
3. Frontend: Deploy to Vercel or Netlify

## 🏛️ Architecture Details

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 📄 License

MIT

## 🙏 Acknowledgments

This project was built as a technical assessment to demonstrate:
- TypeScript type system expertise
- ORM design and implementation
- Clean architecture and separation of concerns
- Testing and documentation best practices
- Deployment and production readiness

---

**Note**: This is a learning project and demonstration of ORM concepts. For production use, consider established ORMs like Prisma, Drizzle, or TypeORM.
