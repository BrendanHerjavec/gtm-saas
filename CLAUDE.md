# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Push schema changes to database (dev)
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio GUI
npm test             # Run Vitest in watch mode
npm run test:run     # Run all tests once (CI mode)
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright E2E with interactive UI
```

### Testing

- **Unit tests:** Vitest with jsdom for server actions (`src/actions/__tests__/`) and components (`src/components/__tests__/`)
- **E2E tests:** Playwright (`e2e/`) - runs against demo mode, no DB required
- **Test mocks:** Shared mocks in `src/__tests__/mocks/` (prisma, auth, demo-mode, email)
- **Factories:** `src/__tests__/factories.ts` for generating test data
- **CI:** GitHub Actions workflow at `.github/workflows/test.yml`

## Architecture Overview

This is a **Next.js 16 App Router** SaaS application for **high-touch gifting and personalized outreach** - an add-on to existing CRMs that enables sales teams to send gifts, experiences, and personalized touches to close deals.

### What This App Does

- **NOT a CRM** - This is a campaign add-on that integrates with existing CRMs (HubSpot, Salesforce, Attio)
- **Gift Sending** - Send physical gifts, digital items, and experiences to recipients
- **Personalized Touches** - Handwritten notes, custom videos, direct mail
- **Budget Tracking** - Manage spend limits and track ROI on gifting
- **CRM Integration** - Sync recipients from your existing CRM

### Tech Stack
- **Framework:** Next.js 16 with React 19, TypeScript
- **Database:** Prisma ORM with PostgreSQL (Supabase) - schema at `prisma/schema.prisma`
- **Auth:** NextAuth v5 (beta) with credentials + Google OAuth - config at `src/lib/auth.ts`
- **UI:** shadcn/ui components (Radix UI + Tailwind CSS v4)
- **State:** Zustand for global state, React Hook Form + Zod for forms
- **Styling:** Tailwind CSS with CSS variables in `src/app/globals.css`

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (login, register)
│   ├── (dashboard)/        # Dashboard pages
│   │   ├── sends/          # Gift/touch sends management
│   │   ├── catalog/        # Gift catalog
│   │   ├── recipients/     # People who receive gifts
│   │   ├── campaigns/      # Grouped sending campaigns
│   │   ├── budget/         # Budget management
│   │   └── integrations/   # CRM connections
│   └── api/auth/           # NextAuth API routes
├── actions/                # Server actions
│   ├── sends.ts            # Send gift/touch actions
│   ├── recipients.ts       # Recipient management
│   ├── catalog.ts          # Gift catalog actions
│   ├── budget.ts           # Budget management
│   └── campaigns.ts        # Campaign actions
├── components/
│   ├── ui/                 # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── layout/             # Sidebar, Header
│   └── features/           # Feature-specific components
├── lib/
│   ├── auth.ts             # NextAuth config + getAuthSession helper
│   ├── prisma.ts           # Prisma client singleton
│   ├── supabase/           # Supabase client utilities
│   └── utils.ts            # cn(), formatCurrency(), formatDate()
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores (app-store.ts)
└── types/                  # TypeScript type extensions
```

### Key Patterns

**Server Actions:** All data operations use Next.js Server Actions in `src/actions/`. Each action:
1. Calls `getAuthSession()` to verify authentication
2. Scopes queries by `organizationId` for multi-tenancy
3. Calls `revalidatePath()` after mutations

**Demo Mode:** `src/lib/auth.ts` has `DEMO_MODE = true` which returns a mock session, bypassing real authentication during development.

**Multi-tenancy:** All data is scoped to an Organization. Always include `organizationId` in queries.

**Component Imports:** Use `@/` path alias for all imports (configured in tsconfig.json).

### Database Models

Core models in `prisma/schema.prisma`:

**Core Entities:**
- **Organization** - Tenant container
- **User** - With role (ADMIN/MEMBER) and organization membership
- **Recipient** - People who receive gifts (synced from CRM)
- **Send** - A gift/touch being sent (core action)
- **GiftItem** - Items in the gift catalog
- **GiftCategory** - Categories for organizing gifts
- **Vendor** - Fulfillment partners (Sendoso, Postal, etc.)

**Supporting Entities:**
- **Campaign** - Grouped sends for tracking
- **Budget** - Spend tracking and limits
- **CRMIntegration** - Connection to external CRM
- **Activity** - Audit trail

### Send Types

The `Send` model supports multiple touch types:
- `GIFT` - Physical gift from catalog
- `HANDWRITTEN_NOTE` - Personalized handwritten note
- `VIDEO` - Custom video message
- `EXPERIENCE` - Event, dinner, booking
- `DIRECT_MAIL` - Physical mail piece

### Adding New Features

1. Add Prisma model to `prisma/schema.prisma`, run `npm run db:push`
2. Create server actions in `src/actions/`
3. Add page in `src/app/(dashboard)/[feature]/page.tsx`
4. Create feature components in `src/components/features/[feature]/`
5. Add navigation link in `src/components/layout/sidebar.tsx`
