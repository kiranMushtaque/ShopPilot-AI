# ShopPilot AI

Local-First, Zero-Budget E-Commerce AI Digital Employee supporting English, Urdu, and Roman Urdu.

## Features
- **Multilingual AI Assistant**: Context-aware shopping assistant supporting English, Urdu, and Roman Urdu with prompt injection defense and local Ollama (`qwen2.5:3b`) integration or deterministic rule-based fallback.
- **Storefront & Catalog**: Category browsing, brand filtering, price range slider, stock availability filter, sorting (price, rating, newest), and keyword search.
- **Product Management**: Detailed product specs, variant selection, and multi-product comparison modal.
- **Cart & Checkout**: Server-authoritative cart calculation, quantity adjustments, item removal, and Cash on Delivery (COD) demo checkout.
- **Order Tracking**: Rate-limited guest order tracking (order number plus registered phone or email, `SP-10001` format, 5 attempts per 15 minutes per IP) and order history view.
- **Authentication & RBAC**: Secure cookie-based session management, password hashing (bcrypt), and Role-Based Access Control (ADMIN, SUPPORT, CUSTOMER).
- **Admin Dashboard**: Business metrics, product catalog management, inventory adjustments, order status updates, and audit logs.
- **Support Desk**: Live support ticket creation, status updates, and support queue management.

## Tech Stack
- **Backend & Server**: Node.js, Express, TypeScript, Zod, Cookie-Parser, Bcryptjs.
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Motion.
- **Database**: PostgreSQL (pgvector image via Docker Compose) with an in-memory fallback store. Vector search is not used yet; the knowledge base uses keyword matching.

## Project Structure
```
├── docker-compose.yml              # Local PostgreSQL + pgvector container configuration
├── .env.example                    # Environment variable template
├── package.json                    # Dependencies, scripts, and project metadata
├── server.ts                       # Express and Vite integrated backend server entrypoint
├── src/
│   ├── ai/                         # AI agent orchestrator, guardrails, memory, tools, and providers
│   ├── api/                        # Express API route handlers (auth, catalog, cart, orders, chat, admin, support, knowledge)
│   ├── auth/                       # Password hashing, RBAC middleware, and session management
│   ├── components/                 # Storefront, checkout, admin, support, and AI widget UI components
│   ├── config/                     # Zod environment validation
│   ├── db/                         # SQL schema, in-memory store, and seed data
│   ├── lib/                        # Utility formatting and sanitization helpers
│   ├── middleware/                 # Rate-limiting middleware
│   ├── services/                   # Business logic services (product, cart, order, knowledge, ticket, analytics)
│   └── types/                      # Shared TypeScript interfaces and DTOs
└── tests/                          # Unit test suite
```

## How It Works
- **Database**: Connects to PostgreSQL via `DATABASE_URL`. If unavailable, gracefully falls back to an in-memory repository initialized with seed data.
- **AI Engine**: Attempts connection to local Ollama (`http://localhost:11434`). If online, synthesizes responses using `qwen2.5:3b`. If offline, switches to `RuleFallbackProvider` for deterministic intent parsing and tool execution.
- **Knowledge Base / RAG**: Indexes documentation chunks (`knowledge_chunks`) and performs keyword frequency similarity matching to ground answers in verified store policies.
- **Auth**: Issues secure HTTP-only cookies storing session tokens mapped to user records.

## Getting Started
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
3. **Start PostgreSQL (Optional)**:
   ```bash
   docker compose up -d
   ```
4. **Start Local Ollama (Optional)**:
   ```bash
   ollama pull qwen2.5:3b
   ollama serve
   ```
5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

## Environment Variables
| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3000` | Server listening port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/shoppilot_db` | PostgreSQL connection string |
| `SESSION_SECRET` | `shoppilot_local_development_secret_key_change_in_production` | Session signing secret |
| `AI_PROVIDER` | `local` | AI provider selector |
| `AI_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `AI_MODEL` | `qwen2.5:3b` | Local LLM model name |
| `EMBEDDING_PROVIDER` | `local` | Defined in config but not used yet (no embeddings are generated). |
| `EMBEDDING_MODEL` | `all-minilm-l6-v2` | Defined in config but not used yet (no embeddings are generated). |

## Demo Accounts
| Email | Password | Role | Notes |
| :--- | :--- | :--- | :--- |
| `admin@shoppilot.local` | `password123` | `ADMIN` | Store admin & analytics access |
| `support@shoppilot.local` | `password123` | `SUPPORT` | Support desk ticketing access |
| `customer@shoppilot.local` | `password123` | `CUSTOMER` | Customer storefront & order history |

Warning: these credentials are for local demos only. Change or remove them before deploying publicly.

## API Endpoints
| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | System health check & Ollama status |
| `POST` | `/api/auth/register` | No | Register new customer account |
| `POST` | `/api/auth/login` | No | Authenticate user & set session cookie |
| `POST` | `/api/auth/logout` | No | Clear session cookie |
| `GET` | `/api/auth/me` | Yes | Get current user session |
| `GET` | `/api/products` | No | List/filter products |
| `GET` | `/api/products/:id` | No | Get product details by ID |
| `GET` | `/api/categories` | No | List store categories |
| `GET` | `/api/cart` | No | Get active cart items & totals |
| `POST` | `/api/cart/items` | No | Add item to cart |
| `PATCH` | `/api/cart/items` | No | Update cart item quantity |
| `DELETE` | `/api/cart/items/:productId` | No | Remove cart item |
| `POST` | `/api/cart/clear` | No | Clear active cart |
| `POST` | `/api/checkout` | No | Place COD order |
| `POST` | `/api/orders/track` | No | Track order (rate-limited) |
| `GET` | `/api/orders/my-orders` | Yes | Customer order history |
| `POST` | `/api/chat/message` | No | Send message to AI assistant |
| `GET` | `/api/chat/history` | No | Fetch chat conversation history |
| `GET` | `/api/admin/dashboard` | Yes (ADMIN) | Admin analytics & recent orders |
| `GET` | `/api/admin/products` | Yes (ADMIN) | Admin product list |
| `POST` | `/api/admin/products` | Yes (ADMIN) | Save/create product |
| `PATCH` | `/api/admin/inventory` | Yes (ADMIN) | Adjust product inventory |
| `GET` | `/api/admin/orders` | Yes (ADMIN) | Admin order management |
| `PATCH` | `/api/admin/orders/:id/status` | Yes (ADMIN) | Update order status |
| `GET` | `/api/admin/audit-logs` | Yes (ADMIN) | View system audit logs |
| `GET` | `/api/support/tickets` | Yes (SUPPORT/ADMIN) | List support tickets |
| `PATCH` | `/api/support/tickets/:id/status` | Yes (SUPPORT/ADMIN) | Update ticket status |
| `GET` | `/api/support/conversations` | Yes (SUPPORT/ADMIN) | List AI conversations |
| `GET` | `/api/knowledge/search` | No | Public RAG knowledge search |
| `GET` | `/api/knowledge/documents` | Yes (ADMIN) | List knowledge documents |
| `POST` | `/api/knowledge/documents` | Yes (ADMIN) | Save/index knowledge document |

## Scripts
- `npm run dev`: Start development server (`tsx server.ts`)
- `npm run build`: Build production bundle (`vite build && esbuild ...`)
- `npm run start`: Start production server (`node dist/server.cjs`)
- `npm run clean`: Clean build output directory (`rm -rf dist`)
- `npm run lint`: Run TypeScript type check (`tsc --noEmit`)
- `npm run typecheck`: Run TypeScript type check (`tsc --noEmit`)
- `npm run test`: Run unit tests (`tsx --test tests/unit.test.ts`)

## Tests
- Total Tests: 3 Master test suites covering Password Validation & Hashing, Prompt Injection Defense, and Conversation Memory Parsing (`tests/unit.test.ts`).

## Known Limitations
- **In-Memory Fallback State**: If PostgreSQL is unreachable, data runs in-memory and resets upon server restart.
- **RAG Implementation**: Knowledge base search utilizes keyword frequency matching rather than vector embeddings.
- **Unused Dependencies**: `@google/genai` is listed in `package.json` but has no imports or usage in the codebase.
- **Default Secret**: Default `SESSION_SECRET` should be changed in production environments.
- **Missing Tests**: Integration and end-to-end browser tests are not currently implemented.
- No database-level row locking (SELECT ... FOR UPDATE) is implemented, so concurrent checkout on low-stock items is not guarded in PostgreSQL mode.
- In PostgreSQL mode, schema.sql is not applied automatically; it must be loaded manually or via the Docker init setup.

## Troubleshooting
- **Port Busy**: Ensure port 3000 is free or change `PORT` in `.env`.
- **Docker/Postgres**: Verify Docker daemon is running before executing `docker compose up -d`.
- **Ollama Connection**: Ensure Ollama is running at `http://localhost:11434` and model `qwen2.5:3b` is pulled (`ollama pull qwen2.5:3b`).
