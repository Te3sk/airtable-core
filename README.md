# @scope/airtable

A TypeScript library for working with the Airtable REST API. Designed for server-side use in Node.js backends and server-side code within React projects.

## Installation

```bash
npm install @scope/airtable
```

## Overview

This library provides a type-safe, reusable interface to the Airtable REST API with two main entrypoints:

- **`@scope/airtable/core`** — Runtime-safe shared types and mappers for use across client and server code
- **`@scope/airtable/server`** — Server-only Airtable client and repository layer

## Security

⚠️ **This library is designed for server-side use only.** API tokens are never embedded in the library and must always be provided by the consumer at runtime. Never expose API tokens to client-side code.

## Entrypoints

### `@scope/airtable/core`

Exports portable types and utilities that can be used in any environment:

- Airtable REST API types (`AirtableRecord`, `AirtableListResponse`, `AirtableListParams`, etc.)
- Domain models and mappers (example: `Lead`, `leadMapper`)

```typescript
import type { AirtableRecord, AirtableFields } from "@scope/airtable/core";

type TaskFields = AirtableFields & {
  Title: string;
  Status: "Open" | "Closed";
};
```

### `@scope/airtable/server`

Exports server-only functionality for interacting with the Airtable API:

- `createAirtableClient` — Factory function to create a configured client
- `listAll` — Auto-pagination helper
- `createTableRepo` — Repository pattern for domain models
- Error classes (`AirtableHttpError`, `AirtableAuthError`, etc.)

## Basic Usage

### Creating a Client

```typescript
import { createAirtableClient } from "@scope/airtable/server";

const client = createAirtableClient({
  token: process.env.AIRTABLE_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
});
```

### CRUD Operations

```typescript
// List records (paginated)
const page = await client.listRecords("Tasks", {
  filterByFormula: "{Status}='Open'",
  sort: [{ field: "Created", direction: "desc" }],
  pageSize: 50,
});

// Get a single record
const record = await client.getRecord("Tasks", "rec123");

// Create a record
const newRecord = await client.createRecord("Tasks", {
  Title: "New Task",
  Status: "Open",
});

// Update a record
const updated = await client.updateRecord("Tasks", "rec123", {
  Status: "Closed",
});

// Delete a record
await client.deleteRecord("Tasks", "rec123");
```

### Auto-Pagination

The `listAll` helper automatically fetches all records by following pagination offsets:

```typescript
import { listAll } from "@scope/airtable/server";

// Fetch all records (with safety limit)
const allTasks = await listAll(client, "Tasks", {
  filterByFormula: "{Status}='Open'",
});

// With custom limit
const limited = await listAll(client, "Tasks", {}, {
  maxTotalRecords: 5000,
});
```

### Repository Pattern

The repository layer provides a clean abstraction over Airtable records using domain models:

```typescript
import { createTableRepo } from "@scope/airtable/server";
import type { AirtableRecord } from "@scope/airtable/core";

// Define your domain model
type Task = {
  id?: string;
  title: string;
  status: "Open" | "Closed";
};

// Define Airtable fields shape
type TaskFields = {
  Title: string;
  Status: "Open" | "Closed";
};

// Create a mapper
const taskMapper = {
  toFields: (task: Partial<Task>): Partial<TaskFields> => ({
    Title: task.title,
    Status: task.status,
  }),
  fromRecord: (record: AirtableRecord<TaskFields>): Task => ({
    id: record.id,
    title: record.fields.Title,
    status: record.fields.Status,
  }),
};

// Create repository
const tasksRepo = createTableRepo<TaskFields, Task>({
  client,
  tableName: "Tasks",
  mapper: taskMapper,
});

// Use repository
const tasks = await tasksRepo.listAll();
const task = await tasksRepo.get("rec123");
const newTask = await tasksRepo.create({ title: "New Task", status: "Open" });
await tasksRepo.update("rec123", { status: "Closed" });
await tasksRepo.delete("rec123");
```

### Error Handling

The library provides normalized error types for better error handling:

```typescript
import {
  AirtableHttpError,
  AirtableAuthError,
  AirtableNotFoundError,
  AirtableRateLimitError,
  AirtableValidationError,
  AirtableNetworkError,
} from "@scope/airtable/server";

try {
  await client.getRecord("Tasks", "rec123");
} catch (err) {
  if (err instanceof AirtableAuthError) {
    // Handle authentication failure (401, 403)
    console.error("Invalid token");
  } else if (err instanceof AirtableNotFoundError) {
    // Handle not found (404)
    console.error("Record not found");
  } else if (err instanceof AirtableRateLimitError) {
    // Handle rate limiting (429)
    console.error("Rate limit exceeded");
  } else if (err instanceof AirtableValidationError) {
    // Handle validation errors (422)
    console.error("Invalid field values:", err.details);
  } else if (err instanceof AirtableNetworkError) {
    // Handle network failures
    console.error("Network error:", err.message);
  } else if (err instanceof AirtableHttpError) {
    // Handle other HTTP errors
    console.error(`API error ${err.status}: ${err.message}`);
  }
}
```

All errors extend `AirtableHttpError` and include:
- `status` — HTTP status code
- `statusText` — HTTP status text
- `url` — Request URL
- `message` — Normalized error message
- `details` — Optional parsed response body

## Project Structure

The library is organized into:

- **`src/core/`** — Shared types, domain models, and mappers
- **`src/server/`** — Server-only client, request handling, pagination, and repositories

This separation allows core types to be imported in any environment (including client-side code for type checking), while server functionality remains server-only.

## Philosophy

- **No embedded secrets** — API tokens are always provided by the consumer
- **Type-safe** — Full TypeScript support with generic field types
- **Minimal and portable** — Core types avoid opinionated modeling
- **Normalized errors** — Consistent error handling across all operations
- **Repository pattern** — Optional abstraction layer for domain models
