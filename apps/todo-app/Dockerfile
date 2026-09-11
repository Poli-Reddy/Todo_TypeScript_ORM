FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/orm/package*.json ./packages/orm/
COPY apps/todo-app/package*.json ./apps/todo-app/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/orm ./packages/orm
COPY apps/todo-app/src ./apps/todo-app/src
COPY apps/todo-app/tsconfig.json ./apps/todo-app/
COPY tsconfig.json ./

# Build
RUN npm run build --workspace=packages/orm
RUN npm run build --workspace=apps/todo-app

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/orm/package*.json ./packages/orm/
COPY apps/todo-app/package*.json ./apps/todo-app/

# Install production dependencies only
RUN npm ci --production

# Copy built files
COPY --from=builder /app/packages/orm/dist ./packages/orm/dist
COPY --from=builder /app/apps/todo-app/dist ./apps/todo-app/dist

WORKDIR /app/apps/todo-app

EXPOSE 3000

CMD ["node", "dist/server.js"]
