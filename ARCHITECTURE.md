# ShopPilot AI Architecture Specification

## 1. Overview
ShopPilot AI is a local-first, zero-cost e-commerce storefront with an autonomous AI sales & customer support associate built specifically for Pakistani electronics retail.

## 2. Core Pillars & Guardrails
- **Zero Paid APIs Policy**: Everything runs locally using free/open-source components (PostgreSQL + pgvector, Ollama with `qwen2.5:3b`, deterministic multilingual fallback NLP engine).
- **Authoritative Server Pricing**: All calculations are calculated and verified exclusively on the backend from the database. Client prices are never trusted.
- **Multilingual Understanding**: Fluent in **English**, **Urdu (اردو)**, and **Roman Urdu** (*"5000 ke andar best earbuds dikhao"*).
- **Role-Based Access Control (RBAC)**:
  - `CUSTOMER`: Browse, add to cart, checkout, view own orders.
  - `SUPPORT`: Manage customer support tickets and view customer escalated conversations.
  - `ADMIN`: Full dashboard analytics, inventory management, order status lifecycle updates, and security audit logs.
- **Rate-Limited Order Tracking**: Guest lookups require Order Number plus registered Phone or Email, strictly limited to 5 attempts per 15 minutes per IP (`guestOrderLookupRateLimit` in `src/middleware/rate-limit.ts`).
- **3-State Action Model**: The flow `AI INTENT -> TOOL EXECUTION -> SERVER CONFIRMATION` is implemented across `AgentOrchestrator`, `RuleFallbackProvider`, and `ToolExecutor`, where user intents trigger validated backend tools (`ToolExecutor`) and are grounded in server-confirmed results recorded in conversation message logs.

## 3. Database Schema (PostgreSQL + pgvector)
The master schema (`src/db/schema.sql`) defines the following tables:
- `stores`: Multi-tenant store configurations.
- `users`: Authenticated user accounts with bcrypt hashed passwords and RBAC roles (`ADMIN`, `SUPPORT`, `CUSTOMER`).
- `categories`: Product categories with SEO slugs.
- `products`: Product catalog with brand, specs, stock quantity, rating, reviews count, and PKR pricing.
- `product_variants`: Product variants with SKU, title, price, and attribute overrides.
- `carts` & `cart_items`: User and guest session carts.
- `orders` & `order_items`: Confirmed orders with Cash on Delivery status, subtotal, shipping, and total amounts. (*Note: `inventory_transactions` table is not present in schema.sql; inventory adjustments are audited via `audit_logs` and product `stock_quantity` updates*).
- `knowledge_documents` & `knowledge_chunks`: `knowledge_chunks` table has a `vector(384)` column, but search currently uses keyword matching (`searchKnowledgeBase`); embeddings are not generated at runtime.
- `conversations` & `chat_messages`: Multi-turn chat logs with recorded tool calls and suggested products.
- `support_tickets`: Human agent escalation queue (`OPEN`, `IN_PROGRESS`, `RESOLVED`).
- `audit_logs`: Immutable security audit ledger tracking inventory adjustments, order creation, and status updates.

## 4. Runtime Modes
- **PostgreSQL Mode**: When `DATABASE_URL` is reachable and PostgreSQL with pgvector is running, the application persists stores, users, products, carts, orders, and chat sessions in the database.
- **In-Memory Fallback Mode**: If PostgreSQL is unreachable, the application seamlessly switches to an in-memory store (`DataStore` in `src/db/store.ts`) initialized with seed data. *Note: Data modified in in-memory mode resets upon server restart.*

## 5. Known Limitations
- No database-level row locking (SELECT ... FOR UPDATE) is implemented. Concurrent checkout on low-stock items is not guarded in PostgreSQL mode.
