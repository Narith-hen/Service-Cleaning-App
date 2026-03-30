# Service Cleaning App

A full-stack cleaning service platform with separate experiences for public visitors, customers, cleaners, and admins.

This repository is organized as a multi-service workspace:

- `frontend`: React + Vite web app
- `backend-api`: Express REST API for auth, bookings, services, payments, reviews, dashboards, and messaging
- `realtime-server`: Socket.IO server for live features
- `workers`: background workers for queued jobs and async processing

## Overview

The project supports:

- public pages for browsing services and registering
- customer flows for booking, messaging, payments, history, reviews, and profile management
- cleaner flows for job requests, schedules, messages, earnings, and settings
- admin flows for dashboards, analytics, bookings, customers, cleaners, reviews, services, reports, and settings

## Tech Stack

- Frontend: React 19, Vite 7, Ant Design, Mantine, Sass
- Backend API: Node.js, Express, MySQL, Redis, JWT
- Realtime: Express, Socket.IO, Redis
- Workers: Node.js, BullMQ, Redis

## Repository Structure

```text
Service-Cleaning-App/
|- frontend/
|- backend-api/
|- realtime-server/
|- workers/
`- README.md
```

## Prerequisites

Install these before running the project:

- Node.js 20+ recommended
- npm
- MySQL
- Redis

Optional integrations:

- Cloudinary for image uploads
- Resend for email delivery
- Google Maps API key for maps/autocomplete in the customer booking flow
- Arcjet for rate limiting and bot protection

## Environment Variables

Do not copy real secrets into version control. Use local `.env` files per service.

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_REALTIME_SERVER_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_ENABLE_MOCK_AUTH=false
```

Notes:

- `VITE_API_BASE_URL` should point to the backend root URL, for example `http://localhost:5000`
- keep the frontend realtime URL aligned with the realtime server `PORT`
- `VITE_ENABLE_MOCK_AUTH=true` is only useful for local UI testing

### `backend-api/.env`

You already have `backend-api/.env.example`. A typical local setup looks like:

```env
NODE_ENV=development
PORT=5000
JSON_BODY_LIMIT=25mb

DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/cleaning_service_db"
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=USER
DB_PASSWORD=PASSWORD
DB_NAME=cleaning_service_db
DB_CONNECTION_LIMIT=10

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

ARCJET_KEY=
ARCJET_MODE=LIVE
ARCJET_REFILL_RATE=10
ARCJET_REFILL_INTERVAL=60
ARCJET_CAPACITY=60

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
RESEND_FROM=
```

### `realtime-server/.env`

You already have `realtime-server/.env.example`. Recommended local config:

```env
NODE_ENV=development
PORT=3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
FRONTEND_URL=http://localhost:5173
JWT_SECRET=use-the-same-secret-as-backend
```

Important:

- the frontend expects the realtime server at `http://localhost:3000` unless you change `VITE_REALTIME_SERVER_URL`
- keep `JWT_SECRET` the same as the backend

### `workers/.env`

The workers currently read Redis config:

```env
NODE_ENV=development
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Installation

Install dependencies in each service folder.

### Windows PowerShell

If `npm` is blocked by PowerShell execution policy, use `npm.cmd`.

```powershell
cd frontend
npm.cmd install

cd ..\backend-api
npm.cmd install

cd ..\realtime-server
npm.cmd install

cd ..\workers
npm.cmd install
```

### macOS / Linux

```bash
cd frontend && npm install
cd ../backend-api && npm install
cd ../realtime-server && npm install
cd ../workers && npm install
```

## Running Locally

Start the services in this order:

1. MySQL
2. Redis
3. `backend-api`
4. `realtime-server`
5. `workers`
6. `frontend`

### Backend API

```powershell
cd backend-api
npm.cmd run dev
```

Default local URL: `http://localhost:5000`

Health check:

- `GET http://localhost:5000/health`

### Realtime Server

```powershell
cd realtime-server
npm.cmd run dev
```

Recommended local URL: `http://localhost:3000`

Health and stats:

- `GET http://localhost:3000/health`
- `GET http://localhost:3000/stats`

### Workers

```powershell
cd workers
npm.cmd run dev
```

Use workers when testing queue-driven or background behavior.

### Frontend

```powershell
cd frontend
npm.cmd run dev
```

Default local URL: `http://localhost:5173`

## Available Scripts

### `frontend`

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview production build

Note:

- the frontend includes a `postinstall` step that removes `sass-embedded` to avoid Windows runtime issues

### `backend-api`

- `npm run dev`: start API with nodemon
- `npm start`: start API with Node
- `npm run seed:dev-users`: seed development users
- `npm run db:fix-user-name-indexes`: DB maintenance utility
- `npm run db:sync-cleaner-review-stats`: DB maintenance utility

### `realtime-server`

- `npm run dev`: start realtime server with nodemon
- `npm start`: start realtime server with Node

### `workers`

- `npm run dev`: start workers with nodemon
- `npm start`: start workers with Node

## Main Backend Routes

The backend mounts these route groups under `/api`:

- `/api/auth`
- `/api/admin`
- `/api/users`
- `/api/services`
- `/api/bookings`
- `/api/payments`
- `/api/notifications`
- `/api/messages`
- `/api/reviews`
- `/api/dashboard`

## Frontend Areas

### Public

- Home
- About
- Contact
- Login
- Register
- Services

### Customer

- dashboard and home
- booking flow
- booking match and quotes
- payments
- messages and chat
- notifications
- favourites
- history
- write review
- profile and settings

### Cleaner

- dashboard
- available jobs
- job requests
- job execution
- my jobs
- schedule
- earnings
- messages
- notifications
- reviews
- settings and profile

### Admin

- dashboard
- analytics
- bookings
- customers
- cleaners
- services
- reviews
- reports
- payments
- users
- settings
- profile

## Troubleshooting

### `vite is not recognized`

Run the frontend from the `frontend` folder and make sure dependencies are installed:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

### Realtime connection issues

Check that:

- `realtime-server` is running
- `PORT` in `realtime-server/.env` matches `VITE_REALTIME_SERVER_URL`
- `FRONTEND_URL` matches your frontend URL

### API connection issues

Check that:

- `backend-api` is running
- `VITE_API_BASE_URL` points to the backend root URL
- MySQL is available

### Maps not loading

Set `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env`.

## Notes

- this repo currently uses separate package installs per service
- there is no root workspace script yet for starting everything together
- keep your `.env` files local and never commit real secrets

## Future Improvements

- add root-level scripts to boot all services together
- add `.env.example` for `frontend` and `workers`
- add database setup and migration documentation
- add deployment instructions for each service
