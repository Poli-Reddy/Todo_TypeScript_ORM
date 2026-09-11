# Implementation Plan: Lightweight TypeScript ORM

## Overview

This implementation plan breaks down the Lightweight TypeScript ORM project into discrete, actionable tasks following the priority order specified in the requirements. Each task builds incrementally on previous work, with testing integrated at appropriate checkpoints. The plan covers the complete implementation from type system through deployment and documentation.

## Tasks

- [x] 1. Initialize monorepo structure and TypeScript configuration
  - Create npm workspaces monorepo with packages/orm and apps/todo-app
  - Set up root package.json with workspaces configuration
  - Create tsconfig.json files for root, ORM package, and Todo app
  - Configure build output for JavaScript and TypeScript declaration files
  - Set up package.json exports field for clean public API
  - _Requirements: 1, 8, 9_

- [x] 2. Implement core TypeScript type system and schema API
  - [x] 2.1 Create field type definitions (number, string, boolean)
    - Implement type constructors with proper TypeScript inference
    - Add JSDoc comments explaining type transformation logic
    - _Requirements: 2, 3_
  
  - [x] 2.2 Implement defineModel function
    - Create model definition function with type inference
    - Use TypeScript generics and mapped types to infer model shape
    - Ensure schema drives TypeScript type inference correctly
    - _Requirements: 2, 3_
  
  - [x]* 2.3 Write unit tests for schema type system
    - Test defineModel creates correct model structure
    - Use @ts-expect-error to verify invalid field names fail compilation
    - Use @ts-expect-error to verify invalid data types fail compilation
    - _Requirements: 3, 12_

- [x] 3. Build query builder foundation
  - [x] 3.1 Create Query Builder interface and core structure
    - Define QueryBuilder class with methods for INSERT, SELECT, UPDATE, DELETE
    - Separate query builder from model API and database driver
    - Design builder pattern for composable queries
    - _Requirements: 4, 5_
  
  - [x] 3.2 Implement INSERT query generation
    - Generate parameterized INSERT SQL from model data
    - Return object with SQL string and parameters array
    - Never interpolate user values directly into SQL
    - _Requirements: 4, 5_
  
  - [x] 3.3 Implement SELECT query generation
    - Generate SELECT ALL query for findMany
    - Generate SELECT with ID WHERE clause for findById
    - Support field projection based on model schema
    - _Requirements: 4, 5_
  
  - [x] 3.4 Implement WHERE clause generation
    - Generate parameterized WHERE conditions
    - Support multiple conditions with AND logic
    - Use positional parameters ($1, $2, etc.)
    - Type-check filter fields against model schema
    - _Requirements: 4, 5_
  
  - [x] 3.5 Implement UPDATE query generation
    - Generate parameterized UPDATE SQL with WHERE clause
    - Support partial updates (only specified fields)
    - _Requirements: 4, 5_
  
  - [x] 3.6 Implement DELETE query generation
    - Generate parameterized DELETE SQL with WHERE clause
    - _Requirements: 4, 5_
  
  - [x]* 3.7 Write unit tests for query builder
    - Test INSERT SQL generation and parameters
    - Test SELECT SQL generation with and without WHERE
    - Test UPDATE SQL generation and parameters
    - Test DELETE SQL generation and parameters
    - Test multiple WHERE conditions produce AND logic
    - Test SQL injection safety (parameters never interpolated)
    - _Requirements: 5, 12_

- [x] 4. Checkpoint - Verify query builder tests pass
  - Ensure all query builder tests pass, ask the user if questions arise.

- [x] 5. Implement PostgreSQL connection layer
  - [x] 5.1 Create database client abstraction
    - Choose and configure pg or @neondatabase/serverless driver
    - Create Client class that abstracts database driver
    - Support connection string and config object initialization
    - Implement connection pooling for serverless environments
    - Add proper error handling with descriptive messages
    - _Requirements: 6_
  
  - [x] 5.2 Implement query execution methods
    - Create executeQuery method that accepts SQL and parameters
    - Return typed results based on operation (INSERT returns row, SELECT returns array)
    - Handle database errors and surface useful error messages
    - _Requirements: 6_
  
  - [x]* 5.3 Write integration tests for database client
    - Test connection establishment
    - Test query execution with parameters
    - Test error handling for invalid queries
    - Test connection works with Postgres-compatible serverless databases
    - _Requirements: 6, 12_

- [x] 6. Implement row mapping and serialization layer
  - [x] 6.1 Create row mapper for database results to model objects
    - Implement mapRow function that converts database row to typed model
    - Validate row matches model schema
    - Handle type mismatches gracefully with clear errors
    - Do NOT use simple type casting (row as Todo)
    - _Requirements: 7_
  
  - [x] 6.2 Create serializer for model objects to SQL parameters
    - Implement serialize function that converts TypeScript values to SQL parameters
    - Handle type conversions (boolean, number, string)
    - _Requirements: 7_
  
  - [x]* 6.3 Write property test for serialization round-trip
    - **Property 1: Serialization round-trip**
    - **Validates: Requirements 7**
    - For any valid model object, serializing then deserializing should produce equivalent object
  
  - [x]* 6.4 Write unit tests for mapper and serializer
    - Test row mapping with valid data
    - Test row mapping handles type mismatches
    - Test serializer converts TypeScript types correctly
    - _Requirements: 7, 12_

- [x] 7. Implement CRUD operations on Model API
  - [x] 7.1 Implement create operation
    - Create db.modelName.create(data) method
    - Use query builder to generate INSERT SQL
    - Use serializer to prepare data
    - Execute query and return created record
    - Type-check input data against model schema
    - _Requirements: 2, 4_
  
  - [x] 7.2 Implement findById operation
    - Create db.modelName.findById(id) method
    - Use query builder to generate SELECT with ID WHERE clause
    - Execute query and map result
    - Return record or null if not found
    - _Requirements: 2, 4_
  
  - [x] 7.3 Implement findMany operation
    - Create db.modelName.findMany(options?) method
    - Support no filters (return all records)
    - Support where filters with type-checked fields
    - Use query builder to generate SELECT with WHERE
    - Execute query and map results
    - _Requirements: 2, 4_
  
  - [x] 7.4 Implement update operation
    - Create db.modelName.update({ where, data }) method
    - Use query builder to generate UPDATE with WHERE
    - Type-check where fields and data fields
    - Execute query and return updated record
    - _Requirements: 2, 4_
  
  - [x] 7.5 Implement delete operation
    - Create db.modelName.delete({ where }) method
    - Use query builder to generate DELETE with WHERE
    - Execute query and return success indicator
    - _Requirements: 2, 4_
  
  - [x]* 7.6 Write unit tests for CRUD operations
    - Test create with valid data
    - Test create rejects invalid data types at compile time
    - Test findById returns record or null
    - Test findMany returns all records
    - Test findMany with filters returns filtered results
    - Test update modifies record
    - Test delete removes record
    - _Requirements: 4, 12_

- [x] 8. Checkpoint - Verify CRUD operations work end-to-end
  - Ensure all CRUD tests pass, ask the user if questions arise.

- [x] 9. Configure ORM package exports and public API
  - [x] 9.1 Create packages/orm/src/index.ts with clean exports
    - Export defineModel, number, string, boolean
    - Export database client initialization
    - Do NOT export internal QueryBuilder, mapper, serializer classes
    - _Requirements: 8_
  
  - [x] 9.2 Configure package.json exports field
    - Set main entry point to built JavaScript
    - Set types entry point to declaration files
    - Configure exports to prevent importing internal modules
    - Add package metadata (name, version, description)
    - _Requirements: 8, 9_
  
  - [x]* 9.3 Write tests verifying package API boundaries
    - Test consumers can import public API
    - Test consumers cannot import internal modules
    - _Requirements: 8, 12_

- [x] 10. Implement Todo application backend
  - [x] 10.1 Create Todo model using ORM
    - Define Todo model with id, title, completed fields
    - Initialize database client with configuration
    - _Requirements: 10_
  
  - [x] 10.2 Implement Todo API routes
    - POST /todos - create todo using db.todo.create
    - GET /todos - list todos using db.todo.findMany
    - GET /todos?filter=completed - filter using where clause
    - GET /todos?filter=incomplete - filter using where clause
    - PUT /todos/:id - update todo using db.todo.update
    - DELETE /todos/:id - delete todo using db.todo.delete
    - All operations must use ORM, never raw SQL
    - _Requirements: 10_
  
  - [x] 10.3 Set up Express server with CORS
    - Create Express app with JSON middleware
    - Enable CORS for frontend access
    - Add error handling middleware
    - _Requirements: 10_
  
  - [x]* 10.4 Write integration tests for Todo backend
    - Test create todo endpoint
    - Test list todos endpoint
    - Test filter completed/incomplete
    - Test update todo endpoint
    - Test delete todo endpoint
    - Verify all operations use ORM correctly
    - _Requirements: 10, 12_

- [x] 11. Implement Todo application frontend
  - [x] 11.1 Set up React + Vite frontend
    - Initialize Vite project with React template
    - Configure TypeScript
    - Set up proxy or API URL for backend
    - _Requirements: 11_
  
  - [x] 11.2 Implement Todo UI components
    - Create input form for adding todos
    - Create todo list display component
    - Add complete/uncomplete toggle button
    - Add delete button
    - Add filter controls (All, Completed, Incomplete)
    - _Requirements: 11_
  
  - [x] 11.3 Integrate frontend with backend API
    - Implement API client functions (createTodo, fetchTodos, updateTodo, deleteTodo)
    - Load existing todos from database on page load
    - Update UI after each operation
    - _Requirements: 11_
  
  - [x]* 11.4 Write frontend tests
    - Test todo creation flow
    - Test todo list rendering
    - Test filtering functionality
    - Test complete/delete operations
    - _Requirements: 11, 12_

- [x] 12. Checkpoint - Verify Todo application works end-to-end
  - Ensure frontend connects to backend, backend uses ORM, ORM connects to PostgreSQL
  - Test complete flow: create, list, filter, update, delete
  - Ask the user if questions arise.

- [x] 13. Set up deployment configuration
  - [x] 13.1 Configure backend deployment
    - Choose deployment platform (Render, Railway, Fly.io, or similar)
    - Create deployment configuration files
    - Set up environment variables for database connection
    - Configure build and start scripts
    - _Requirements: 14_
  
  - [x] 13.2 Configure frontend deployment
    - Set up frontend build process
    - Configure API URL for production
    - Choose deployment platform (Vercel, Netlify, or similar)
    - _Requirements: 14_
  
  - [x] 13.3 Set up PostgreSQL database
    - Create Postgres-compatible serverless database (Neon, Supabase, or similar)
    - Create todos table with schema
    - Configure connection string
    - Test connection from deployed backend
    - _Requirements: 14_

- [x] 14. Deploy application and verify
  - [x] 14.1 Deploy backend and frontend
    - Deploy backend to chosen platform
    - Deploy frontend to chosen platform
    - Verify environment variables are set correctly
    - _Requirements: 14_
  
  - [x] 14.2 Verify deployed application functionality
    - Test publicly accessible URL loads frontend
    - Test create todo works on deployed app
    - Test list todos shows database records
    - Test filter works (All, Completed, Incomplete)
    - Test update todo (mark completed/incomplete)
    - Test delete todo
    - Verify all operations persist to live database
    - _Requirements: 14_

- [x] 15. Create comprehensive documentation
  - [x] 15.1 Write README.md
    - Document installation steps
    - Document setup and database configuration
    - Document how to run ORM locally
    - Document how to run Todo application locally
    - Provide ORM usage examples (schema definition, CRUD, filtering)
    - Document type safety features and limitations
    - Include known limitations
    - Include deployment instructions
    - Include live deployed Todo URL
    - Include approximate time spent
    - Include AI tools used during development
    - _Requirements: 13_
  
  - [x] 15.2 Write ARCHITECTURE.md
    - Document package structure (monorepo layout)
    - Explain module boundaries and separation
    - Document ORM design philosophy
    - Explain Model API design
    - Explain TypeScript type inference approach
    - Document Query Builder architecture
    - Document SQL generation approach
    - Document database driver abstraction
    - Document row mapping and serialization
    - Explain key design tradeoffs
    - Include data flow diagram: Model API → Query Builder → SQL Generation → Database Driver → PostgreSQL
    - _Requirements: 13_

- [x] 16. Perform complete self-audit against requirements
  - Review entire codebase against all 18 requirement sections
  - Create audit table with columns: Requirement | Acceptance Criterion | Status | Evidence | Problems
  - Use status codes: 🟢 COMPLETE & CORRECT, 🟠 COMPLETE BUT INCORRECT, 🟡 PARTIALLY COMPLETE, 🔴 NOT IMPLEMENTED, ⚪ IMPLEMENTED BUT UNVERIFIED
  - Calculate completeness and correctness percentages
  - Identify and document any gaps or issues
  - _Requirements: 18_

- [x] 17. Fix critical issues identified in audit
  - Address any 🔴 NOT IMPLEMENTED mandatory requirements
  - Fix any 🟠 COMPLETE BUT INCORRECT implementations
  - Rerun all tests after fixes
  - Update audit table with new status
  - _Requirements: 18_

- [x] 18. Final verification and report
  - Verify all mandatory requirements are 🟢 COMPLETE & CORRECT
  - Confirm deployed application is fully functional
  - Confirm all tests pass
  - Generate final audit report
  - Document production/deployment readiness assessment
  - _Requirements: 18_

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for faster MVP
- Each task references specific requirement sections for traceability
- Checkpoints ensure incremental validation at critical milestones
- Property tests validate universal correctness properties (serialization round-trip)
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests verify end-to-end flows with actual PostgreSQL database
- The implementation follows strict priority order: Type system → Schema → Query builder → SQL generation → PostgreSQL → CRUD → Filtering → Mapping → Package exports → Monorepo → Tests → Todo backend → Todo frontend → Deployment → Documentation
- Do NOT stub functionality, use raw SQL from Todo app, or fake test results
- The Todo application must import ORM through package name, never internal paths
- All database operations in Todo app must use the ORM
