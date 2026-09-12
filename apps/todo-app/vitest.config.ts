import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Dummy URL so importing the app (db.ts requires DATABASE_URL at import)
    // works without a real database. The pg Pool is lazy — no connection is
    // made until a query runs. Tests below only hit validation/health paths.
    env: {
      DATABASE_URL: 'postgresql://localhost:5432/todos_test',
    },
  },
});
