# Discr Admin

![GitHub branch status](https://img.shields.io/github/checks-status/discrapp/admin/main)
![GitHub Issues](https://img.shields.io/github/issues/discrapp/admin)
![GitHub last commit](https://img.shields.io/github/last-commit/discrapp/admin)
![GitHub repo size](https://img.shields.io/github/repo-size/discrapp/admin)
![GitHub License](https://img.shields.io/github/license/discrapp/admin)

## Introduction

Admin dashboard for managing the Discr disc golf application. Built with
Next.js and deployed on Cloudflare Pages.

### Key Features

- Order management for printer fulfillment
- Role-based access control (admin/printer)
- Real-time updates via Supabase Realtime
- Business analytics and insights (planned)
- User management (planned)
- Content moderation (planned)

## Prerequisites

- Node.js 22+ and npm
- Supabase project with admin credentials
- Cloudflare account (for deployment)

## Setup

### Installation

```bash
npm install
```

### Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Setting Up Admin Users

To grant admin access to a user, update their `app_metadata` in Supabase:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
WHERE email = 'your-email@example.com';
```

For printer partners (orders-only access):

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "printer"}'
WHERE email = 'printer@example.com';
```

## Development

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

### Cloudflare Preview

```bash
npm run preview
```

## Deployment

Deploy to Cloudflare Pages:

```bash
npm run deploy
```

Or build and deploy separately:

```bash
npm run build:cloudflare
npm run deploy:only
```

Set environment variables in Cloudflare Pages dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Roles

| Role | Access |
|------|--------|
| `admin` | Full access to all modules |
| `printer` | Orders module only |

## Project Structure

```text
admin/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Authenticated pages with sidebar
│   │   │   ├── orders/        # Order management
│   │   │   └── page.tsx       # Dashboard home
│   │   ├── login/             # Login page
│   │   └── unauthorized/      # Access denied page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── app-sidebar.tsx    # Navigation sidebar
│   └── lib/
│       └── supabase/          # Supabase client setup
├── wrangler.jsonc             # Cloudflare Workers config
└── package.json
```

## Contributing

Upon first clone, install the pre-commit hooks:

```bash
pre-commit install
```

To run pre-commit hooks locally:

```bash
pre-commit run --all-files
```

This project uses conventional commits for version management:

```text
feat: add new feature
fix: resolve bug
docs: update documentation
chore: maintenance tasks
```

## License

See LICENSE file for details.
