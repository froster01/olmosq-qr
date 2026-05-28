# Agent Instructions

## Project Snapshot

Olmosq QR is a Next.js App Router application for cafe table ordering. Customers scan a table QR code, browse the menu synced from Loyverse, submit counter-payment orders, and staff manage shifts, payment collection, preparation, cash drawer tracking, and Loyverse receipt sync.

Core stack:

- Next.js 16.2.6, React 19.2.4, TypeScript strict mode
- App Router under `app/` with route groups `(customer)` and `(staff)`
- Prisma ORM 7.8 with PostgreSQL through `@prisma/adapter-pg`
- Tailwind CSS 4, shadcn/base-nova components, Base UI primitives, lucide icons
- Zod for server-side input validation
- Node's built-in `node:test` tests run through `tsx`

## Required Next.js Rule

This is NOT the Next.js you know. This project uses Next.js 16, which has breaking changes and conventions that may differ from model memory. Before writing code that touches routing, layouts, pages, server/client components, route handlers, data fetching, caching, metadata, config, or Server Functions, read the relevant local guide in `node_modules/next/dist/docs/`.

Useful local docs for this repo:

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`

Important Next 16 habits already used here:

- Dynamic route `params` and page `searchParams` are promises; await them before use.
- Server Components are the default. Add `"use client"` only for state, effects, browser APIs, event handlers, or client hooks.
- A `"use client"` file pulls its imports into the client bundle, so keep client boundaries narrow.
- Server Functions/Actions are reachable by direct POST. Validate inputs and enforce business rules inside the action, not only in the UI.
- Route Handlers live in `app/**/route.ts`; do not place a `route.ts` beside a `page.tsx` at the same segment.

## Repository Map

- `app/(customer)/table/[tableCode]/page.tsx`: server-rendered table ordering entry, table validation, open-shift gate, menu query.
- `app/(customer)/table/[tableCode]/ordering-client.tsx`: customer cart and checkout client workflow.
- `app/(customer)/order/[orderId]/confirmation/page.tsx`: customer confirmation page.
- `app/(staff)/staff/**`: staff dashboard, orders, menu sync, tables, cash drawer, shift reports.
- `app/actions/orders.ts`: customer order submission and staff order status mutation.
- `app/actions/loyverse.ts`: menu/payment sync and Loyverse receipt creation actions.
- `app/actions/shifts.ts`: local shift and cash drawer actions.
- `app/api/payment-types/route.ts`: payment type endpoint.
- `app/(staff)/staff/orders/api/route.ts`: staff order feed endpoint.
- `components/customer/**`: mobile-first customer ordering UI.
- `components/staff/**`: staff operational UI.
- `components/ui/**`: shadcn/base-nova UI primitives. Prefer extending these over inventing new primitives.
- `lib/db.ts`: singleton Prisma client using `DATABASE_URL`.
- `lib/orders/**`: order status, receipt summary, and submit-order validation helpers.
- `lib/shifts/**`: shift lifecycle, cash reporting, and shift order numbering helpers.
- `lib/payments/**`: cash drawer and change calculation helpers.
- `lib/loyverse/**`: Loyverse API client, menu/payment sync, receipt builder, and POS types.
- `prisma/schema.prisma`: database schema and domain enums.
- `prisma/migrations/**`: existing migrations. Add a new migration for schema changes instead of editing applied migrations.
- `PRD-qr-ordering-system.md`: product intent and source of truth for MVP behavior.

## Domain Rules

- The live order system is Next.js/Postgres. Loyverse receives only completed paid receipts.
- Menu data, payment types, receipt IDs, and inventory/reporting come from Loyverse.
- Staff payment confirmation happens outside the customer QR flow. Do not add online payment assumptions unless asked.
- Current counter-first behavior sends submitted customer orders to `AWAITING_PAYMENT`.
- Successful payment and receipt sync currently return paid orders to `PREPARING`; failed receipt sync also keeps prep moving while logging the sync error.
- Orders belong to the currently open shift. Closed-shift orders must not be mutated or paid.
- Shift display order numbers restart per shift via `shiftOrderNumber`; legacy global `orderNumber` remains unique.
- Keep money handling explicit. Convert Prisma `Decimal` values at UI/action boundaries and avoid floating point shortcuts in business helpers.
- Treat Loyverse IDs and local Prisma IDs as different identifiers. Receipt payloads must use Loyverse IDs.

## Code Style

- Use TypeScript and existing `@/*` path aliases.
- Keep business logic in `lib/**` when it can be unit tested without React.
- Keep database writes in Server Actions or server-only helpers; never expose Prisma or Loyverse tokens to client components.
- Validate external or form input with Zod or narrow helper functions before mutation.
- Return small action result objects such as `{ success: true, data }` or `{ success: false, error }`, matching the current style.
- Prefer server-rendered pages that pass serialized data into narrow client components.
- Use `notFound()` from `next/navigation` for invalid public route entities where appropriate.
- Preserve existing route groups and URLs.
- Keep comments sparse and useful. Avoid restating the code.

## UI Conventions

- Customer screens are mobile-first and use `min-h-dvh`, sticky headers, sheets/dialogs, and concise cafe-facing copy.
- Staff screens are operational: scannable lists, status badges, tabs, clear action buttons, and tablet/desktop-friendly spacing.
- Reuse `components/ui` primitives and `cn` from `@/lib/utils`.
- Use lucide icons for button/icon affordances when an icon is needed.
- Do not create new UI systems unless the existing primitives cannot reasonably support the need.
- Check responsive layouts for customer phone widths and staff tablet/desktop widths when changing UI.

## Data And Environment

Required environment variables are documented in `.env.example`:

- `DATABASE_URL`
- `LOYVERSE_ACCESS_TOKEN`
- `LOYVERSE_STORE_ID`
- `NEXT_PUBLIC_BASE_URL`
- `DIRECT_URL` is optional and used by Prisma migrations when present.

Never commit real `.env` secrets or paste token values into logs, tests, docs, or error messages.

Prisma notes:

- Runtime Prisma client is configured in `lib/db.ts`.
- Prisma CLI config is in `prisma.config.ts`; migrations use `DIRECT_URL || DATABASE_URL`.
- `npm run build` runs `prisma generate` before `next build`.
- After schema changes, create and inspect migrations, update seed data if needed, and regenerate the client.

## Testing And Verification

Use the smallest command that proves the change, then broaden when the risk is higher.

Common commands:

- `npm run lint`
- `npm run build`
- `npx tsx --test 'lib/**/*.test.ts'`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npx prisma db seed`

Notes:

- There is currently no `npm test` script; use the `tsx --test` command for the existing Node test files.
- For pure business helpers in `lib/**`, add or update colocated `*.test.ts` tests.
- For Server Actions, test extracted validation/status/payment helpers where practical.
- For UI changes, run lint/build and manually verify the affected route in a browser when a dev server is available.
- If verification cannot run because env vars, database, network, or Loyverse credentials are missing, state the exact blocker.

## Agent Workflow

- Start by checking `git status --short`; this repo may contain user changes. Do not revert unrelated work.
- Read the relevant files before editing. Prefer `rg`/`rg --files` for discovery.
- Keep changes scoped to the requested behavior.
- Before modifying Next.js APIs or conventions, read the relevant local Next docs listed above.
- Before modifying Prisma schema, inspect existing migrations and domain helpers.
- Before modifying Loyverse sync, inspect `lib/loyverse/types.ts` and existing receipt/menu/payment tests.
- Update tests when business behavior changes.
- Run relevant verification before claiming completion.
- In final notes, mention changed files and verification results, including any command that could not be run.

