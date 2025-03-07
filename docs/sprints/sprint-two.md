**Sprint 2: Leaderboard Display, Authentication, & Tenant Handling**

**Goal:** Display fetched leaderboard data on the frontend, implement basic user authentication, and set up the tenant middleware.

**Instructions for AI:** (Same as before)

1.  **Read each task carefully...**
2.  **Generate the necessary code...**
3.  **Test your work thoroughly...**
4.  **Review your code...**
5.  **Mark the task as complete...**
6.  **Move on to the next task...**
7.  **Ask for clarification if needed...**
8.  **If any changes or refactoring is done, inform accordingly**

**Tasks:**

1.  **Create API Route for Fetching Leaderboard Data (Backend) [ ]**

    *   **Task:** Create a new API endpoint (using either GraphQL or tRPC) in the NestJS backend that allows the frontend to fetch leaderboard data. This endpoint should:
        *   Accept `tenantId` and `casino` as input parameters.
        *   Optionally accept `page` and `pageSize` parameters for pagination.
        *   Use the `LeaderboardService` (which we'll create/modify in the next task) to retrieve the data.
        *   Return the data in a JSON format suitable for the frontend.
    *   **Acceptance Criteria:**
        *   An API endpoint exists (e.g., `/graphql` or a tRPC route) that can be called to fetch leaderboard data.
        *   The endpoint returns the data in the expected JSON format.
        *   The endpoint handles pagination correctly.
    *   **Specifications:**
        *   Use either GraphQL or tRPC (your preference). If using GraphQL, create a resolver. If using tRPC, create a procedure.
        *   The returned data should be an array of objects, each representing a leaderboard entry.
        *   Use Zod for input validation and output shaping.
        * Example (using GraphQL):
            ```graphql
            type Query {
              leaderboardData(tenantId: String!, casino: String!, page: Int, pageSize: Int): [LeaderboardEntry!]!
            }
            ```
        * Example Return Data
          ```json
          [
            {
                "casinoPlayerId": "someUser",
                "casino": "stake",
                "wagerAmount": 123,
                "rank": 1,
                "timestamp": "2024-03-02T12:00:00.000Z",
                "data": {
                    "raw": "data"
                }
            }
          ]
          ```

2.  **Refactor/Create Leaderboard Service Methods (Backend) [ ]**

    *   **Task:** Update the existing, or create a new, `LeaderboardService` with the method `getLeaderboardData` to include:
        *   Proper pagination.
        *   Efficient data retrieval (using the database, *not* fetching from the casino API directly on every request).
        *   Return cached data.
        *   Proper typing.
    *   **Acceptance Criteria:**
        *   Method to fetch cached leaderboard data is created.
        *   Method to retrieve cached leaderboard data is created.
        *   Method to handle pagination is created.
        *   Methods are properly typed.
    * **Specifications:**
        *   The `getLeaderboardData` method should take `tenantId`, `casino`, `page`, and `pageSize` as input.
        *   It should query the `LeaderboardEntry` table (or your cached data source), filtering by `tenantId` and `casino`.
        *   It should implement pagination using `skip` and `take` (or equivalent) in the database query.
        * Add redis retrieval.

3.  **Create Leaderboard Display Component (Frontend) [ ]**

    *   **Task:** Create a new Next.js component (e.g., `LeaderboardTable.tsx`) in the `packages/frontend/components` directory. This component should:
        *   Fetch data from the API endpoint created in Task 1.
        *   Display the leaderboard data in a table format.
        *   Handle loading and error states.
        *   Implement pagination (using buttons or infinite scrolling).
        *   Be reusable (accept data as props).
    *   **Acceptance Criteria:**
        *   The `LeaderboardTable` component exists.
        *   It displays leaderboard data in a table.
        *   It handles loading and error states gracefully.
        *   It implements pagination.
    *   **Specifications:**
        *   Use `TanStack Query` for data fetching and caching.
        *   The component should accept `tenantId` and `casino` as props (at least initially).
        *   The component should display a loading indicator while data is being fetched.
        *   The component should display an error message if data fetching fails.
        *   The component should display the leaderboard data in a table with appropriate column headers.
        *   The component should implement pagination (you can choose between buttons or infinite scrolling).

4.  **Integrate Leaderboard Component into Home Page (Frontend) [ ]**

    *   **Task:** Integrate the `LeaderboardTable` component into a suitable page within the `packages/frontend` directory. For initial testing, this could be the main `app/page.tsx` or a dedicated testing page (e.g., `app/test/page.tsx`). For now, you can hardcode the `tenantId` and `casino` values that you pass as props to the `LeaderboardTable`.
    *   **Acceptance Criteria:**
        *   A page displays the leaderboard table.
        *   Data is fetched and displayed correctly (using the hardcoded `tenantId` and `casino`).
    * **Specifications:**
       * This will be used for testing, hardcode the values.

5.  **Implement Basic Authentication (Backend) [ ]**

    *   **Task:** Integrate SuperTokens into the NestJS backend. For this sprint, focus on a *basic* email/password authentication flow.
        *   Implement signup, login, and logout functionality.
        *   Secure the API endpoint created in Task 1 (require authentication).
        *   Create a basic user profile page (just to test authentication).
    *   **Acceptance Criteria:**
        *   Users can sign up and log in.
        *   The API endpoint for fetching leaderboard data is protected (requires a valid JWT).
        *   A basic user profile page exists and can only be accessed by logged-in users.
    *   **Specifications:**
        *   Use SuperTokens' email/password recipe.
        *   Store user passwords securely (hashed and salted). SuperTokens handles this.
        *   Use JWTs for session management. SuperTokens handles this.
        *   Protect the leaderboard data API endpoint using SuperTokens' authentication middleware.

6.  **Tenant Middleware (Backend) [ ]**

    *   **Task:** Implement the `tenantMiddleware` in the NestJS backend. This middleware should:
        *   Extract the tenant ID from the request (e.g., from the hostname or a custom header). For this sprint, you can assume the tenant ID is provided in a header (e.g., `X-Tenant-Id`).
        *   Attach the tenant ID to the request object (so it can be accessed by other parts of the application).
        *   Handle cases where the tenant ID is missing or invalid (return a 404 error).
        * Implement Caching.
    *   **Acceptance Criteria:**
        *   The `tenantMiddleware` exists.
        *   It correctly extracts the tenant ID from the request (from the `X-Tenant-Id` header).
        *   It attaches the tenant ID to the request object (e.g., `req.tenantId`).
        *   It handles invalid or missing tenant IDs by returning a 404 error.
    *   **Specifications:**
        *   Create a file `packages/backend/src/middleware/tenant.middleware.ts`.
        *   Implement the middleware as a NestJS `NestMiddleware`.
        *   Use the `@Injectable()` decorator.
        *   Implement the `use(req: Request, res: Response, next: NextFunction)` method.
        *   Apply the middleware globally in your `AppModule`.

7.  **Integrate Tenant Context into API (Backend) [ ]**

    *   **Task:** Modify the API endpoint for fetching leaderboard data (created in Task 1) to use the tenant ID from the request object (provided by the `tenantMiddleware`). This ensures that users can only access data for their own tenant.
    *   **Acceptance Criteria:**
        *   The API endpoint uses the tenant ID from the request context (e.g., `req.tenantId`).
        *   Users can only access data for their own tenant (attempting to access data for a different tenant ID results in an error).

8.  **Update Frontend to Pass Tenant ID [ ]**

    *   **Task:** Update the `LeaderboardTable` component (or the data fetching logic) in the frontend to include the `X-Tenant-Id` header in the API requests. For now, you can continue to hardcode the tenant ID.
    *   **Acceptance Criteria:**
        *   API requests from the frontend include the `X-Tenant-Id` header.
        *   The correct tenant ID is being passed in the header.

This refined Sprint 2 plan maintains the core goals while providing more specific guidance for the AI, aligning with your development approach and the overall project architecture. It focuses on a vertical slice of functionality: fetching, displaying, and securing leaderboard data, with basic authentication and tenant isolation.
