# Deployment

## Recommended path: Render Blueprint

This repo includes `render.yaml` for:

- `geo-places-backend` as a Node web service
- `geo-places-frontend` as a static site
- `geo-places-db` as PostgreSQL

In Render, create a new Blueprint from the Git repository root. During setup, provide:

```env
GEMINI_API_KEY=...
VITE_API_BASE_URL=https://<backend-service-url>
```

After the first backend service is created, use its public URL for `VITE_API_BASE_URL`, then redeploy the frontend if needed.

The backend runs migrations with:

```bash
npm run migration:run:prod
```

## Alternative split deploy

Backend:

```bash
cd geo-places-backend
npm ci
npm run build
npm run migration:run:prod
npm run start:prod
```

Required backend env:

```env
DATABASE_URL=postgresql://...
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

Required frontend env:

```env
VITE_API_BASE_URL=https://<backend-service-url>
```
