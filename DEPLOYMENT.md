# AWS Deployment Guide (MobaXterm + EC2)

This project contains:

- `frontend`: Vite React app
- `backend-api`: REST API, Prisma, uploads
- `realtime-server`: Socket.IO / WebSocket server
- `workers`: optional background jobs using Redis

If your goal is the simplest full deployment on AWS from MobaXterm, use:

- 1 Ubuntu EC2 instance for `backend-api`, `realtime-server`, `workers`, and Nginx
- 1 Amazon RDS MySQL database
- 1 Redis instance
  - easiest: Redis on the same EC2 for first deployment
  - better: Amazon ElastiCache for Redis
- 1 domain or subdomains

Recommended subdomains:

- `app.yourdomain.com` -> frontend
- `api.yourdomain.com` -> backend API
- `rt.yourdomain.com` -> realtime server

## Recommended AWS Architecture

For a first real deployment, this is the most practical setup:

1. Launch an Ubuntu EC2 instance.
2. Create an RDS MySQL instance.
3. Create Redis or install Redis on the EC2 instance.
4. Use MobaXterm SSH to connect to EC2.
5. Run the Node services with PM2.
6. Put Nginx in front of everything.
7. Build the frontend and serve it with Nginx.
8. Add SSL with Let's Encrypt.

This keeps the project simple and matches the current codebase well.

## Important Project-Specific Notes

- Backend health check: `GET /health`
- Realtime health check: `GET /health`
- Backend default port in code: `5000`
- Realtime default port in code: `4000`
- Frontend `VITE_API_BASE_URL` should be the backend origin only, for example `https://api.yourdomain.com`
  The frontend code automatically appends `/api`.
- `backend-api` serves `/uploads` from local disk
  Uploaded files can be lost if you redeploy the server or replace the instance unless you use persistent storage.
- `workers/src/config/database.js` imports Prisma from `backend-api/node_modules/@prisma/client`
  Because of that, `workers` is safest on the same EC2 instance as `backend-api` unless you refactor that file first.

## Step 1: Create AWS Resources

### EC2

Create:

- Ubuntu 22.04 EC2 instance
- instance size: start with `t3.small` or `t3.medium`
- 20 GB or more storage

Security group inbound rules:

- `22` from your IP only
- `80` from anywhere
- `443` from anywhere

Do not open:

- `5000`
- `4000`
- `6379`
- `3306`

Those should stay private.

### RDS MySQL

Create:

- MySQL 8.x
- database name: `cleaning_service_db`
- save the hostname, username, password, and port

Allow the EC2 security group to access the RDS instance.

### Redis

Choose one:

1. Quick setup
   Install Redis directly on EC2.
2. Better production setup
   Use Amazon ElastiCache for Redis.

If you use ElastiCache, allow the EC2 security group to connect to it.

## Step 2: Connect with MobaXterm

In MobaXterm:

1. Open `Session`.
2. Choose `SSH`.
3. Remote host: your EC2 public IP or domain.
4. Specify username: `ubuntu`.
5. Under advanced SSH settings, select your `.pem` key.
6. Connect.

You can use the left SFTP panel in MobaXterm to upload project files, or clone from Git on the server.

## Step 3: Prepare the EC2 Server

Run these commands after SSH login:

```bash
sudo apt update
sudo apt install -y nginx redis-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v
npm -v
pm2 -v
```

If you will use ElastiCache instead of local Redis, installing `redis-server` is optional.

## Step 4: Upload or Clone the Project

Option A: clone with Git

```bash
git clone <your-repository-url>  Service-Cleaning-App
cd  Service-Cleaning-App
```

Option B: upload from MobaXterm

- Upload the full project folder to `/home/ubuntu/ Service-Cleaning-App`
- Then SSH into that folder:

```bash
cd /home/ubuntu/ Service-Cleaning-App
```

## Step 5: Configure Environment Variables

Create production `.env` files on the server.

### `backend-api/.env`

```env
NODE_ENV=production
PORT=5000
JSON_BODY_LIMIT=25mb

DATABASE_URL="mysql://root:@localhost:3306/cleaning_service_db"
DB_HOST=localhost
DB_USER=DB_root
DB_PASSWORD=
DB_NAME=cleaning_service_db
DB_CONNECTION_LIMIT=10

JWT_SECRET=dev-local-jwt-secret-change-me
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

If you use ElastiCache, replace `REDIS_HOST=127.0.0.1` with the ElastiCache endpoint.

### `realtime-server/.env`

```env
NODE_ENV=production
PORT=3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
FRONTEND_URL=https://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this
```

If you use ElastiCache, replace `REDIS_HOST`.

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_REALTIME_SERVER_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=
```

Do not set `VITE_API_BASE_URL` to `https://api.yourdomain.com/api`.
The frontend already adds `/api` internally.

### Optional `workers/.env`

```env
NODE_ENV=development
DATABASE_URL="mysql://root:@localhost:3306/cleaning_service_db"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Step 6: Install Dependencies and Build

From the project root on EC2:

### Backend

```bash
cd /home/ubuntu/ Service-Cleaning-App/backend-api
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
```

### Realtime server

```bash
cd /home/ubuntu/ Service-Cleaning-App/realtime-server
npm install
```

### Frontend

```bash
cd /home/ubuntu/ Service-Cleaning-App/frontend
npm install
npm run build
```

### Optional workers

```bash
cd /home/ubuntu/ Service-Cleaning-App/workers
npm install
```

## Step 7: Start Services with PM2

Start all app services:

```bash
cd /home/ubuntu/ Service-Cleaning-App
pm2 start backend-api/src/server.js --name backend-api
pm2 start realtime-server/src/server.js --name realtime-server
pm2 start workers/src/index.js --name workers
pm2 save
pm2 startup
```

If you do not need workers yet, skip the workers command.

Useful PM2 commands:

```bash
pm2 status
pm2 logs backend-api
pm2 logs realtime-server
pm2 logs workers
pm2 restart backend-api
pm2 restart realtime-server
pm2 restart workers
```

## Step 8: Configure Nginx

Create an Nginx site file:

```bash
sudo nano /etc/nginx/sites-available/ Service-Cleaning-App
```

Example config:

```nginx
server {
    server_name app.yourdomain.com;

    root /home/ubuntu/ Service-Cleaning-App/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}

server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name rt.yourdomain.com;

    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/ Service-Cleaning-App /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

If the default site causes conflicts:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Point Your Domain to EC2

Create DNS records:

- `app` -> EC2 public IP
- `api` -> EC2 public IP
- `rt` -> EC2 public IP

Wait for DNS propagation before enabling SSL.

## Step 10: Add SSL

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request certificates:

```bash
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com -d rt.yourdomain.com
```

After SSL is installed, test:

- `https://api.yourdomain.com/health`
- `https://rt.yourdomain.com/health`
- `https://app.yourdomain.com`

## Step 11: Smoke Test

Check backend:

```bash
curl https://api.yourdomain.com/health
```

Check realtime:

```bash
curl https://rt.yourdomain.com/health
```

Check PM2:

```bash
pm2 status
```

Then test in the browser:

1. Open the frontend.
2. Register or log in.
3. Confirm API requests work.
4. Open chat or notifications with two accounts.
5. Confirm WebSocket events work.

## Common Problems

### Frontend loads but API calls fail

Check:

- `frontend/.env`
- Nginx `api.yourdomain.com` block
- backend PM2 logs

Remember:

- use `VITE_API_BASE_URL=https://api.yourdomain.com`
- not `https://api.yourdomain.com/api`

### Socket connection fails

Check:

- `realtime-server/.env`
- `FRONTEND_URL` exactly matches the frontend origin
- Nginx websocket proxy config
- realtime PM2 logs

### Database migration fails

Check:

- RDS security group
- `DATABASE_URL`
- DB username and password

Retry:

```bash
cd /home/ubuntu/ Service-Cleaning-App/backend-api
npm run prisma:migrate:deploy
```

### Uploads disappear

This is expected if you rely on instance-local storage and later replace the server.

Better long-term options:

- store uploads in Cloudinary
- mount persistent storage
- move uploads to S3

### Workers fail on a separate machine

Current code imports Prisma from:

```text
backend-api/node_modules/@prisma/client
```

So for now:

- run `workers` on the same EC2 instance as `backend-api`
- or refactor `workers/src/config/database.js` before splitting services across machines

## Suggested First Deployment Path

If you want the least risky path, deploy in this order:

1. EC2
2. RDS
3. Redis
4. backend-api
5. realtime-server
6. frontend
7. workers
8. SSL

## Minimal Command Checklist

```bash
cd /home/ubuntu/ Service-Cleaning-App/backend-api
npm install
npm run prisma:generate
npm run prisma:migrate:deploy

cd /home/ubuntu/ Service-Cleaning-App/realtime-server
npm install

cd /home/ubuntu/ Service-Cleaning-App/frontend
npm install
npm run build

cd /home/ubuntu/ Service-Cleaning-App
pm2 start backend-api/src/server.js --name backend-api
pm2 start realtime-server/src/server.js --name realtime-server
pm2 start workers/src/index.js --name workers
pm2 save
```

## Next Improvement After First Deploy

After the first successful deployment, the best upgrades are:

1. move uploads to Cloudinary or S3
2. move Redis to ElastiCache
3. refactor workers to use their own Prisma client
4. add a CI/CD pipeline
