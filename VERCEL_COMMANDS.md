# How to Run Commands in Vercel

## Option 1: Using Vercel CLI (Recommended)

### Install Vercel CLI
```bash
npm i -g vercel
# or
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Link Your Project
```bash
vercel link
```
This will ask you to select your project.

### Run Commands in Vercel Environment

#### Run Prisma Commands
```bash
# Push schema to database
vercel env pull .env.local
npx prisma db push

# Or with production environment
vercel --prod env pull .env.local
npx prisma db push
```

#### Run Custom Scripts
```bash
# Run any npm script
vercel --prod npm run db:push:prod

# Or run commands directly
vercel --prod exec "npx prisma db push"
```

## Option 2: Add to Build Process

You can add database migrations to your build process in `vercel.json`:

```json
{
  "buildCommand": "prisma generate && prisma db push && next build"
}
```

**Note:** This runs migrations on every build, which may not be ideal for production.

## Option 3: Run Locally with Production DATABASE_URL

### Get Environment Variables from Vercel
```bash
# Pull all environment variables
vercel env pull .env.local

# Or pull specific environment
vercel env pull .env.local --environment=production
```

### Run Commands Locally
```bash
# Use the .env.local file
npx prisma db push
npm run db:seed
```

## Option 4: Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Copy the `DATABASE_URL` value
4. Run commands locally with that value:

```bash
DATABASE_URL="your-connection-string" npx prisma db push
```

## Quick Setup for Database Tables

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login and Link
```bash
vercel login
vercel link
```

### Step 3: Pull Environment Variables
```bash
vercel env pull .env.local
```

### Step 4: Push Schema
```bash
npx prisma db push
```

### Step 5: (Optional) Seed Data
```bash
npm run db:seed
```

## Running One-Off Commands

For one-time commands, you can use:

```bash
# Run in production environment
vercel --prod exec "npx prisma db push"

# Or run locally with production env vars
vercel env pull .env.local --environment=production
source .env.local  # or use dotenv
npx prisma db push
```

## Troubleshooting

### If Vercel CLI is not installed
```bash
npm install -g vercel
```

### If you get authentication errors
```bash
vercel login
```

### If you need to switch projects
```bash
vercel link
```

### To see all available commands
```bash
vercel --help
```

