# Deployment Guide

This project has three backend-side services:

- `backend-api`: REST API, Prisma, file uploads
- `realtime-server`: Socket.IO server for chat, notifications, job matching
- `workers`: optional background queue workers backed by Redis

If you only want the app online, deploy `backend-api`, `realtime-server`, and your frontend. Deploy `workers` if you rely on background queue processing.

## Recommended architecture

- Frontend: static host
- Backend API: Node.js host
- Realtime server: separate Node.js host with WebSocket support
- Database: MySQL
- Cache / pub-sub: Redis

## Before you deploy

1. Create a managed MySQL database.
2. Create a managed Redis instance.
3. Choose domains, for example:
   - Frontend: `https://app.example.com`
   - Backend: `https://api.example.com`
   - Realtime: `https://rt.example.com`
4. Make sure backend and realtime use the same `JWT_SECRET`.

## Backend API

Service root:

```text
backend-api
```

Build command:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
```

Start command:

```bash
npm start
```

Required environment variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/cleaning_service_db"
DB_HOST=HOST
DB_USER=USER
DB_PASSWORD=PASSWORD
DB_NAME=cleaning_service_db
JWT_SECRET=replace-with-a-long-random-secret
REDIS_HOST=HOST
REDIS_PORT=6379
```

Optional environment variables:

```env
JSON_BODY_LIMIT=25mb
JWT_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12
ARCJET_KEY=
ARCJET_MODE=LIVE
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
RESEND_FROM=
```

Health check:

```text
GET /health
```

Notes:

- This service serves `/uploads` from local disk. On ephemeral hosts, uploaded files can disappear on redeploy.
- For production, prefer Cloudinary or persistent disk/object storage for user uploads.
- Run Prisma migrations during deploy with `npm run prisma:migrate:deploy`.

## Realtime Server

Service root:

```text
realtime-server
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required environment variables:

```env
NODE_ENV=production
PORT=3000
REDIS_HOST=HOST
REDIS_PORT=6379
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=replace-with-the-same-jwt-secret-as-backend
```

Health check:

```text
GET /health
```

Notes:

- Your host must support WebSockets.
- `FRONTEND_URL` must exactly match the deployed frontend origin.
- The realtime server uses Redis pub/sub, so it must be able to reach the same Redis instance as the backend.

## Frontend

Add these values to `frontend/.env` before building:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_REALTIME_SERVER_URL=https://your-realtime-domain.com
VITE_GOOGLE_MAPS_API_KEY=
```

Then build with:

```bash
npm install
npm run build
```

## Optional workers

Service root:

```text
workers
```

Start command:

```bash
npm start
```

Environment variables:

```env
NODE_ENV=production
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/cleaning_service_db"
REDIS_HOST=HOST
REDIS_PORT=6379
```

Notes:

- `workers/src/config/database.js` currently loads Prisma from `backend-api/node_modules/@prisma/client`.
- If you deploy workers separately, make sure the backend dependencies are available too, or refactor workers to use their own local Prisma client.

## Deploy order

1. Deploy MySQL and Redis.
2. Deploy `backend-api`.
3. Run backend migrations.
4. Deploy `realtime-server`.
5. Deploy the frontend with the final backend and realtime URLs.
6. Deploy `workers` if needed.

## Quick smoke test

1. Open `https://your-backend-domain.com/health`.
2. Open `https://your-realtime-domain.com/health`.
3. Load the frontend and log in.
4. Open chat or notifications in two accounts and confirm socket events work.
