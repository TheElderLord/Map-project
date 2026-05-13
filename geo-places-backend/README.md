# Geo Places Backend

NestJS backend for storing map places in PostgreSQL via TypeORM entities and migrations. No manual SQL scripts are required: schema and starter data are created through TypeORM migrations.

## Stack

- NestJS
- PostgreSQL
- TypeORM
- class-validator / class-transformer

## Environment

Create `.env` from `.env.example` and set your database values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=geo_places
```

## Install and run

```bash
npm install
npm run migration:run
npm run start:dev
```

## Migrations

Available scripts:

```bash
npm run migration:run
npm run migration:revert
npm run migration:show
```

Initial migrations create the `places` table and preload several Almaty points, including Kok Tobe, Panfilov Park, Green Bazaar, and MEGA Alma-Ata.

## Frontend

The repository now also contains a React + Vite client in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Optional frontend env:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Optional AI env for backend:

```env
AI_PROVIDER=gemini

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

Supported `AI_PROVIDER` values are `gemini` and `openai`. If the selected provider key is not set, `POST /places/ai/recommendations` returns a local fallback based on visible places, ratings, and place types.

## API

Base route: `http://localhost:3000/places`

### AI route planner

`POST /places/ai/recommendations`

```json
{
  "prompt": "Plan a relaxed two hour walk",
  "places": [
    {
      "id": 1,
      "title": "Kok Tobe",
      "type": "PARK",
      "rating": 4.7,
      "latitude": 43.234,
      "longitude": 76.975
    }
  ]
}
```

### Create place

`POST /places`

```json
{
  "title": "Coffee Boom",
  "description": "Кофейня в Алматы",
  "type": "CAFE",
  "address": "Almaty",
  "rating": 5,
  "latitude": 43.238949,
  "longitude": 76.889709
}
```

### Filter and sort

`GET /places?type=CAFE&minRating=3&sortBy=rating&sortOrder=desc`

Supported query params:

- `type`
- `search`
- `minRating`
- `sortBy=title|rating|createdAt`
- `sortOrder=asc|desc`
