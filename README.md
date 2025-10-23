# Lumiere Frontend

Frontend monorepo for Lumiere trading platform.

## Structure
```
lumiere-frontend/
├── marketing/          # Marketing website (lumiere.trade)
├── app/                # Trading application (app.lumiere.trade)
└── shared/             # Shared components (@lumiere/shared)
```

## Development
```bash
# Install dependencies
npm install --legacy-peer-deps

# Run marketing site
npm run dev:marketing

# Run trading app
npm run dev:app
```

## Building
```bash
# Build all
npm run build

# Build specific
npm run build:marketing
npm run build:app
```

## Deployment

- Marketing: Vercel project with root directory `marketing/`
- App: Vercel project with root directory `app/`

Both auto-deploy on push to `main`.
