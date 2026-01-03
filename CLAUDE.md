# Discr Admin - Project Memory

This file contains persistent context for Claude Code sessions on this project.
It will be automatically loaded at the start of every session.

## Project Overview

This is the admin dashboard for Discr, built with Next.js and deployed on
Cloudflare Pages. It provides management tools for order fulfillment, user
management, analytics, and system monitoring.

**Key Details:**

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, Database, Realtime)
- **Deployment:** Cloudflare Pages via opennextjs-cloudflare
- **Domain:** admin.discrapp.com
- **CI/CD:** GitHub Actions with release workflow
- **Linting:** Pre-commit hooks for code quality

## Purpose

The admin dashboard serves multiple purposes:

1. **Order Fulfillment** - Manage sticker orders for printer partner
1. **User Management** - View and manage user accounts
1. **Analytics** - Business metrics and insights
1. **Content Moderation** - Disc catalog and user submissions
1. **AI Monitoring** - Model performance tracking
1. **System Health** - Error tracking and notifications

## Repository Structure

```text
admin/
├── .github/workflows/     # CI/CD workflows
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (dashboard)/   # Dashboard routes (authenticated)
│   │   │   ├── orders/    # Order management
│   │   │   ├── users/     # User management
│   │   │   └── ...        # Other admin modules
│   │   ├── login/         # Login page
│   │   └── layout.tsx     # Root layout
│   ├── components/        # Reusable components
│   │   └── ui/            # shadcn/ui components
│   └── lib/               # Utilities
│       └── supabase/      # Supabase client setup
├── public/                # Static assets
├── next.config.ts
├── wrangler.jsonc         # Cloudflare Workers config
└── package.json
```

## Role-Based Access Control

The dashboard supports two roles via Supabase JWT claims:

### Admin Role

- Full access to all modules
- Can manage users, approve catalog submissions
- Access to system health and AI insights

### Printer Role

- Order Management module only
- Can view orders, update status, download PDFs
- Cannot access user data, payments, or system settings

**Role Implementation:**

```sql
-- Roles are stored in auth.users.raw_app_meta_data
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
WHERE email = 'admin@discrapp.com';
```

SQL helper functions in the API repo:

- `is_admin()` - Check if user has admin role
- `is_printer()` - Check if user has printer role
- `is_admin_or_printer()` - Check if user has either role

## Development Setup

### Prerequisites

- Node.js 22+ and npm
- Supabase CLI (for local development)
- Cloudflare account (for deployment)

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Running Locally

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Cloudflare Deployment

```bash
npm run build:cloudflare  # Build for Cloudflare
npm run preview           # Preview locally
npm run deploy            # Deploy to Cloudflare Pages
```

## Git Workflow

**CRITICAL:** All changes MUST go through Pull Requests. Never commit directly
to main.

1. **Create feature branch:** `git checkout -b feature/description`
1. **Make changes** to code or documentation
1. **Write markdown correctly the FIRST time** - Use markdownlint style:
   - Keep lines under 80 characters (break long lines manually)
   - Use `1.` for all ordered list items (auto-numbered)
   - Add blank lines around fenced code blocks
   - Do NOT rely on pre-commit hooks to fix formatting
1. **ALWAYS run pre-commit BEFORE committing:** `pre-commit run --all-files`
   - Fix ALL errors before committing
   - Do NOT commit with `--no-verify` unless absolutely necessary
1. **Commit with conventional format:** `git commit -m "type: description"`
1. **Push and create PR:** `gh pr create --title "feat: description"`
1. **Get PR reviewed and merged** - Never push directly to main

**Commit Format:** Conventional Commits (enforced by pre-commit hook)

- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `docs:` - Documentation changes (no version bump)
- `chore:` - Maintenance (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `style:` - Code style changes (no version bump)

## Pre-commit Hooks

**Installed hooks:**

- YAML linting (yamllint)
- Markdown linting (markdownlint)
- Conventional commit format
- File hygiene (trailing whitespace, EOF, etc.)
- Security scanning (checkov)
- GitHub Actions linting (actionlint)

**Setup:**

```bash
pre-commit install              # One-time setup
pre-commit run --all-files      # Run manually
pre-commit autoupdate           # Update hook versions
```

## Important Notes

### Test-Driven Development (TDD) - MANDATORY

**CRITICAL:** All new code MUST be developed using Test-Driven Development:

1. **Write tests FIRST** - Before writing any implementation code, write tests
1. **Red-Green-Refactor cycle:**
   - RED: Write a failing test for the new functionality
   - GREEN: Write minimal code to make the test pass
   - REFACTOR: Clean up while keeping tests green
1. **Test coverage requirements:**
   - All components must have unit tests
   - All API interactions must be tested
   - All user flows must have integration tests
1. **Test file locations:**
   - Component tests: `__tests__/<component>.test.tsx`
   - Integration tests: `__tests__/integration/`
1. **Running tests:**

   ```bash
   npm test                    # Run all tests
   npm test -- --watch         # Watch mode
   npm test -- --coverage      # With coverage report
   ```

**DO NOT write implementation code without tests. This is non-negotiable.**

### Code Quality Standards

**CRITICAL:** All code must adhere to linter and prettier rules from the start.

- **Write prettier-compliant code** - Don't rely on pre-commit hooks to fix
  formatting. This wastes cycles and creates noisy diffs.
- Use 2-space indentation
- Keep lines under 100 characters for TypeScript

### Next.js Best Practices

- Use TypeScript for all new code
- Use App Router patterns (not Pages Router)
- Server Components by default, Client Components when needed
- Optimize images using next/image
- Handle loading and error states properly

### Supabase Realtime

The orders page uses Supabase Realtime for live updates:

```typescript
const channel = supabase
  .channel('orders-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'sticker_orders' },
    (payload) => {
      // Handle update
    }
  )
  .subscribe();
```

### Security

- Never commit `.env` file
- Use environment variables for all config
- Validate all user inputs
- RLS policies enforce access control at database level

## Dashboard Modules

### Implemented

- **Orders** - Full order lifecycle management with status updates

### Planned

- **Dashboard** - Overview metrics and alerts
- **Users** - User account management
- **Disc Catalog** - Content moderation
- **Recovery Events** - Analytics
- **AI Insights** - Model performance
- **QR Codes** - Inventory management
- **Payments** - Stripe monitoring
- **System** - Health and errors

---

## Implementation Patterns (For Claude)

### Server Component with Data Fetching

```typescript
// src/app/(dashboard)/orders/page.tsx
import { createClient } from '@/lib/supabase/server';
import { requireAdminOrPrinter } from '@/lib/auth';

export const dynamic = 'force-dynamic'; // Always fresh data

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  await requireAdminOrPrinter(); // Redirects if not authorized
  const params = await searchParams;
  const supabase = await createClient();

  const { data: orders, count } = await supabase
    .from('sticker_orders')
    .select(`*, profiles:user_id (email, full_name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 19);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Orders</h1>
      <OrdersTable orders={orders || []} totalCount={count || 0} />
    </div>
  );
}
```

### Client Component with Realtime Updates

```typescript
// src/app/(dashboard)/orders/orders-table.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function OrdersTable({ orders, totalCount }) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sticker_orders' },
        () => router.refresh()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, router]);

  return <Table>{/* ... */}</Table>;
}
```

### Client Component with State Update

```typescript
// src/app/(dashboard)/orders/[id]/order-status-updater.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function OrderStatusUpdater({ orderId, currentStatus }) {
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      const { error } = await supabase
        .from('sticker_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(null);
    }
  };

  return <Button onClick={() => updateStatus('shipped')}>Mark Shipped</Button>;
}
```

### UI Component Pattern (shadcn/ui with CVA)

```typescript
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border bg-background hover:bg-accent",
        ghost: "hover:bg-accent",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

### Auth Utilities

```typescript
// src/lib/auth.ts
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type UserRole = 'admin' | 'printer';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = user.app_metadata?.role as UserRole;
  if (role !== 'admin' && role !== 'printer') return null;
  return { user: { id: user.id, email: user.email }, role };
}

export async function requireAdmin() {
  const auth = await getAuthenticatedUser();
  if (!auth || auth.role !== 'admin') redirect('/orders');
  return auth;
}

export async function requireAdminOrPrinter() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect('/unauthorized');
  return auth;
}
```

### File Map - Where to Edit

| Task | Files to Edit |
|------|---------------|
| Add new page | `src/app/(dashboard)/[feature]/page.tsx` + `loading.tsx` + `error.tsx` |
| Add UI component | `src/components/ui/[name].tsx` |
| Add sidebar nav | `src/components/app-sidebar.tsx` (navItems array) |
| Add toast | `import { toast } from 'sonner'` → `toast.success('Message')` |
| Add auth check | Use `requireAdmin()` or `requireAdminOrPrinter()` at page top |
| Change colors | `src/app/globals.css` (CSS variables) |

### Adding a New Dashboard Page

1. Create `src/app/(dashboard)/feature/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function FeaturePage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from('table').select('*');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Feature</h1>
      {/* UI here */}
    </div>
  );
}
```

2. Add loading state `src/app/(dashboard)/feature/loading.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
  return <Skeleton className="h-96 w-full" />;
}
```

3. Update sidebar in `src/components/app-sidebar.tsx`:

```typescript
const navItems = [
  // ... existing
  { title: 'Feature', url: '/feature', icon: IconName, adminOnly: true },
];
```

### Database Query Patterns

```typescript
// SELECT with relations
const { data } = await supabase
  .from('sticker_orders')
  .select(`*, profiles:user_id (email, full_name, username)`)
  .eq('id', orderId)
  .single();

// Paginated list with count
const { data, count } = await supabase
  .from('sticker_orders')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(offset, offset + pageSize - 1);

// Filtered query
let query = supabase.from('sticker_orders').select('*', { count: 'exact' });
if (status !== 'all') query = query.eq('status', status);
if (search) query = query.ilike('order_number', `%${search}%`);
const { data, count } = await query;

// UPDATE
const { error } = await supabase
  .from('sticker_orders')
  .update({ status: 'shipped', shipped_at: new Date().toISOString() })
  .eq('id', orderId);
```

## References

- @README.md - Repository overview
- Mobile app: `../mobile/`
- API functions: `../api/supabase/functions/`
- Web landing: `../web/`
- Next.js Documentation: <https://nextjs.org/docs>
- Tailwind CSS: <https://tailwindcss.com/docs>
- shadcn/ui: <https://ui.shadcn.com>
- Supabase: <https://supabase.com/docs>

---

**Last Updated:** 2025-12-30

This file should be updated whenever:

- Project patterns change
- Important context is discovered
- New modules are added
- Tooling is added or modified
