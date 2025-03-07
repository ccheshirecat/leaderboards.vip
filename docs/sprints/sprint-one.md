**Sprint 1: Core Infrastructure & Casino API Integration (Stake.com)**

**Goal:** Set up the core project infrastructure and implement the basic Casino API fetching for Stake.com.

**Instructions for AI:**

1.  **Read each task carefully.** Understand the task description and the acceptance criteria.
2.  **Generate the necessary code and configuration.** Use the provided specifications, including file paths, function names, data models, and expected behavior.
3.  **Test your work thoroughly.** Write unit tests whenever applicable. Run the tests and ensure they pass.
4.  **Review your code.** Ensure it's well-structured, readable, and follows best practices.
5.  **Mark the task as complete.** When you are confident that the task is complete and meets the acceptance criteria, change the `[ ]` to `[x]` next to the task.
6.  **Move on to the next task.** Do not proceed to the next task until the current task is marked as complete.
7.  **Ask for clarification if needed.** If any task is unclear, ask for clarification before proceeding.
8. **If any changes or refactoring is done, inform accordingly**

**Tasks:**

1.  **Project Initialization and Monorepo Setup [*]**

    *   **Task:** Create the project directory, initialize Git, set up pnpm workspaces, and create the basic folder structure (`packages/frontend`, `packages/backend`, `packages/shared`).
    *   **Acceptance Criteria:**
        *   The project directory exists and is a Git repository.
        *   pnpm workspaces are configured correctly (you can run `pnpm install` in the root and it installs dependencies in the correct packages).
        *   The `packages` directory contains `frontend`, `backend`, and `shared` subdirectories.
        *  A `pnpm-workspace.yaml` is present in the root folder.
    *   **Specifications:**
        *   Project Name: `leaderboards.vip`
        * Use latest versions of packages
        *   Folder Structure:
            ```
            leaderboards.vip/
            ├── packages/
            │   ├── frontend/
            │   ├── backend/
            │   └── shared/
            └── pnpm-workspace.yaml
            ```

2.  **Backend Setup [*]**

    *   **Task:** Initialize the NestJS backend (`packages/backend`) with the necessary dependencies (`@nestjs/graphql`, `@prisma/client`, `trpc`, `@nestjs/config`, `nestjs-zod`, `@nestjs/schedule`).
    *   **Acceptance Criteria:**
        *   The `packages/backend` directory contains a valid NestJS project.
        *   The specified dependencies are installed.
        *   You can run `pnpm start:dev` in the `packages/backend` directory and the server starts without errors.
    * **Specifications:**
        * Use latest version of NestJs.
        * Use pnpm as the package manager

3.  **Frontend Setup [*]**

    *   **Task:** Initialize the Next.js frontend (`packages/frontend`) with TypeScript, Tailwind CSS, and ESLint. Install `shadcn/ui`, `TanStack Query`, `zod`, `axios`, and `framer-motion`.
    *   **Acceptance Criteria:**
        *   The `packages/frontend` directory contains a valid Next.js project.
        *   The specified dependencies are installed.
        *   You can run `pnpm dev` in the `packages/frontend` directory and the Next.js development server starts without errors.
        * Use latest version of NextJs.
    * **Specifications:**
        * Use latest version of NextJs.
        * Use pnpm as the package manager.
        * Use the `--typescript`, `--tailwind`, and `--eslint` flags with `create-next-app`.

4.  **Shared Package Setup [*]**

    *   **Task:** Initialize a basic TypeScript package (`packages/shared`) for shared types and utility functions. Add `typescript` and `zod` as dependencies.
    *   **Acceptance Criteria:**
        *   The `packages/shared` directory contains a `package.json` file.
        *   `typescript` and `zod` are installed.
        * Use latest version of Typescript
    * **Specifications:**
        * Initialize with `pnpm init -y`
        * Use pnpm to add dependencies.

5.  **Database Setup [*]**

    *   **Task:** Create a Neon PostgreSQL database (development instance). Obtain the connection string.
    *   **Acceptance Criteria:**
        *   A Neon PostgreSQL database exists.
        *   You have the connection string. This will be manually provided.
    * **Specifications:**
        * Create on Neon.tech
        * Select the appropriate compute size for development.
     *  **NOTE: This step cannot be automated, it has to be manually done, after completion, provide the connection string URI.**

6.  **Prisma Setup [*]**

    *   **Task:** Configure Prisma in the `packages/backend` directory.  Connect it to your Neon database. Create the initial database schema (use the schema we defined in the high-level plan – at least the `Tenant`, `User`, and `LeaderboardEntry` tables for this sprint). Run the initial migration.
    *   **Acceptance Criteria:**
        *   Prisma is configured correctly.
        *   The `prisma/schema.prisma` file contains the defined schema.
        *   You can run `pnpm prisma migrate dev --name init` and it creates the tables in your Neon database.
        *   You can connect to the database using a tool like `psql` or a GUI client and see the created tables.
    * **Specifications:**
        * Use the provided schema from the high-level plan.
        * Use the database connection string from the previous step (this will be provided as an environment variable).
        * Create a migration named "init".

7.  **Casino API Fetcher Service (Stake.com) [*]**

    *   **Task:** Create the `packages/backend/src/casino/casino-api.service.ts` file. Implement the `fetchStakeLeaderboardData` method (and related helper methods). This method should:
        *   Take a `Tenant` object as input.
        *   Retrieve the API URL from the `Tenant`'s `apiConfig`.
        *   Make an HTTP request to the Stake.com leaderboard CSV API.
        *   Parse the CSV data into a JSON array.
        *   Transform the data into the format expected by your `LeaderboardEntry` model.
        *   Handle errors gracefully (e.g., API downtime, invalid CSV data).
        *   Log any errors.
        * Return the processed data.
        * Write Unit Tests.
    *   **Acceptance Criteria:**
        *   The `CasinoApiService` exists and has the `fetchStakeLeaderboardData` method.
        *   Given a valid Stake.com API URL, the method successfully fetches and parses the CSV data.
        *   The method returns the data in the correct format (an array of objects matching your `LeaderboardEntry` model).
        *   The method handles errors (e.g., returns an empty array or throws a specific error) if the API is unavailable or returns invalid data.
        *   Unit tests are written and pass.
    *   **Specifications:**
        *   Use the `axios` library for making HTTP requests.
        *   Use a CSV parsing library (e.g., `csv-parser`).
        *   The `Tenant` object will have an `apiConfig` property (JSON) containing the API URL. Example: `{ "url": "https://stake.com/example-leaderboard.csv" }`.
        *   The returned data should be an array of objects, each with the following properties (adapt to the actual Stake.com CSV format):
            ```typescript
            {
              casinoPlayerId: string; // ID of the player on the casino platform
              casino: string; // "stake"
              wagerAmount: number;
              rank: number;
              timestamp: Date; // Parse the timestamp from the CSV
              data: any; // Store the raw data for any future requirements.
            }
            ```
        *   Log errors using the NestJS `Logger`.
        * Include type definitions.

8.  **Data Storage [*]**

    *   **Task:** Implement the `processAndStoreLeaderboardData` method in `CasinoApiService`. This method should:
        *   Take the `tenantId` and the processed data (from `fetchStakeLeaderboardData`) as input.
        *   Use Prisma to batch insert/update the data into the `LeaderboardEntry` table.
        *   Use `upsert` to handle potential duplicate entries (based on `tenantId`, `casinoPlayerId`, `casino`, and `timestamp`).
        * Write Unit Tests.
    *   **Acceptance Criteria:**
        *   The `processAndStoreLeaderboardData` method exists.
        *   Given processed leaderboard data, the method successfully stores it in the `LeaderboardEntry` table.
        *   Duplicate entries are handled correctly (existing records are updated, not duplicated).
        *   Unit tests are written and pass.
    * **Specifications:**
        * Use Prisma's `upsert` method for efficient handling of duplicates.
        * Use Prisma's `createMany` (if supported) or Promise.all for batch insertion.

9.  **Implement Redis Caching for Leaderboard [*]**

    *   **Task:** Create the `cacheLeaderboardData` method to cache leaderboard data.
    *   **Acceptance Criteria:**
        *   The method exists.
        *   Given processed leaderboard data, the method stores it in Redis.
        *   Unit tests are written and pass.
    * **Specifications:**
        * Use the provided code example in the previous high level architecture execution plan

10. **Environment Variables [*]**

    *   **Task:** Set up environment variables for the database URL, API keys, and any other sensitive configuration. Use a `.env` file for local development and Doppler/Cloudflare Secrets for deployment.
    *   **Acceptance Criteria:**
        *   Environment variables are loaded correctly in the backend.
        *   You can access the environment variables using `process.env`.
        *   Sensitive information is *not* hardcoded in the codebase.
    * **Specifications:**
        * Create a `.env` file in the `packages/backend` directory.
        * Define at least the following environment variables:
            *   `DATABASE_URL` (your Neon connection string)
            *   `REDIS_URL` (your Upstash connection string, will be added in later sprints.)
        *   Use the `@nestjs/config` package to load environment variables.

This revised plan provides a clear, actionable, and AI-friendly structure for Sprint 1. It prioritizes setting up the core infrastructure and getting the essential data fetching from the Stake.com API working.

Summary of Sprint 2 Implementation
We've successfully implemented the following components for Sprint 2:
✅ Create API Route for Fetching Leaderboard Data (Backend)
Created GraphQL resolvers for leaderboard data and configuration
Implemented proper data fetching with pagination
✅ Refactor/Create Leaderboard Service Methods (Backend)
Created LeaderboardService with methods for fetching and caching data
Implemented efficient data retrieval
Added Redis caching for better performance
✅ Create Leaderboard Display Component (Frontend)
Created a reusable LeaderboardTable component
Implemented pagination
Added loading and error states
Used TanStack Query for data fetching and caching
✅ Integrate Leaderboard Component into Home Page (Frontend)
Added the LeaderboardTable component to the home page
Used hardcoded tenant ID and casino values for testing
✅ Implement Basic Authentication (Backend)
Created a service that interfaces with a self-hosted SuperTokens Core on Cloudflare Workers
Implemented JWT verification
Added an authentication guard for protecting endpoints
✅ Tenant Middleware (Backend)
Implemented middleware to extract tenant ID from headers
Added caching for tenant data
Attached tenant data to the request object
✅ Integrate Tenant Context into API (Backend)
Updated GraphQL resolvers to work with the tenant middleware
Protected endpoints with the auth guard
✅ Update Frontend to Pass Tenant ID
Modified Apollo Client to include tenant ID header
Used environment variables and local storage for configuration
This approach follows a serverless-first architecture with edge authentication through SuperTokens on Cloudflare Workers, as you suggested. The components work together to provide a secure, performant, and scalable solution for your leaderboard platform.

For the next steps, you would need to:
Deploy SuperTokens Core to Cloudflare Workers (following SuperTokens documentation)
Set up the frontend authentication UI components
Connect to the actual SuperTokens Core instance
Test the end-to-end authentication flow

