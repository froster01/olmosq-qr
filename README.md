This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server with local Docker:

```bash
cp .env.example .env
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

This starts two local containers:

- `olmosq-app-local`: Next.js dev server
- `olmosq-postgres-local`: local PostgreSQL database

Inside Docker, the app uses:

```env
DATABASE_URL="postgresql://olmosq_local:local_password@postgres-local:5432/olmosq_local?schema=public"
DIRECT_URL="postgresql://olmosq_local:local_password@postgres-local:5432/olmosq_local?schema=public"
```

From your host machine, database tools can connect through port `5434`:

```env
DATABASE_URL="postgresql://olmosq_local:local_password@localhost:5434/olmosq_local?schema=public"
```

To stop local Docker:

```bash
docker compose down
```

To run the seed data inside Docker:

```bash
docker compose exec app-local npx prisma db seed
```

If you want to reset the local database:

```bash
docker compose down -v
```

Or run the development server directly on your host:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## VPS Docker Deployment

This repo includes a Docker Compose setup for one VPS with separate production
and staging app containers plus isolated local Postgres containers.

See [docs/vps-docker-deploy.md](docs/vps-docker-deploy.md) for the runbook.

GitHub Actions are included for CI, staging deploys, and manually approved
production deploys.
