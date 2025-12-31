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
