# Backend Server - Quick Run Guide

This guide will help you get the MindMesh+ backend server up and running.

## Prerequisites

Before starting, ensure you have:
1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
3. **npm** (comes with Node.js)

## Step-by-Step Setup

### Step 1: Install Dependencies

Open a terminal in the `server` directory and run:

```bash
cd server
npm install
```

This will install all required packages including Express, PostgreSQL client, Socket.io, LangChain, and other dependencies.

### Step 2: Set Up PostgreSQL Database

1. **Start PostgreSQL** on your system
   - Windows: Start the PostgreSQL service from Services
   - Mac/Linux: `sudo systemctl start postgresql` or `brew services start postgresql`

2. **Create a database** (if not already created):
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create the database
   CREATE DATABASE mindmesh;
   
   # Exit psql
   \q
   ```

   Or use pgAdmin or any PostgreSQL GUI tool to create a database named `mindmesh`.

### Step 3: Configure Environment Variables

1. **Copy the example environment file**:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your database credentials:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mindmesh
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

   **Important**: Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

### Step 4: Start the Server

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The server will:
- Connect to PostgreSQL
- Automatically create all required tables (if they don't exist)
- Seed initial therapist data
- Start listening on `http://localhost:4000` (or the port specified in `.env`)

### Step 5: Verify the Server is Running

1. **Check the console output** - You should see:
   ```
   Postgres schema ready
   MindMesh+ Backend Server running on http://localhost:4000
   WebRTC signaling active
   Health check: http://localhost:4000/health
   ```

2. **Test the health endpoint**:
   - Open your browser and go to: `http://localhost:4000/health`
   - Or use curl: `curl http://localhost:4000/health`
   - You should see a JSON response with server status

## Troubleshooting

### Database Connection Errors

**Error**: `Connection refused` or `password authentication failed`

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Mac/Linux
   sudo systemctl status postgresql
   ```

2. Check your `.env` file has the correct database credentials
3. Verify the database exists: `psql -U postgres -l` (should list `mindmesh`)

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::4000`

**Solutions**:
1. Change the `PORT` in your `.env` file to a different port (e.g., `4001`)
2. Or stop the process using port 4000:
   ```bash
   # Windows
   netstat -ano | findstr :4000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:4000 | xargs kill
   ```

### Missing Dependencies

**Error**: `Cannot find module 'express'` or similar

**Solution**: Run `npm install` again in the `server` directory

### JWT Secret Not Set

**Error**: `JWT_SECRET is not defined`

**Solution**: Make sure your `.env` file contains `JWT_SECRET=your-secret-key`

## API Endpoints

Once the server is running, you can access:

- **Health Check**: `GET http://localhost:4000/health`
- **Authentication**: `POST http://localhost:4000/api/auth/signup` or `/api/auth/login`
- **Chat (AI Agent)**: `POST http://localhost:4000/api/chat/message`
- **Journals**: `GET/POST http://localhost:4000/api/journal`
- **Habits**: `GET/POST http://localhost:4000/api/habits`
- **Emotions**: `GET/POST http://localhost:4000/api/emotions`

See `README.md` for complete API documentation.

## Next Steps

1. **Test Authentication**: Create a user account via `/api/auth/signup`
2. **Test Chat**: Send a message to the AI chat agent (requires authentication)
3. **Connect Frontend**: Update your frontend's API URL to `http://localhost:4000`

## Development Tips

- Use `npm run dev` for development (auto-reloads on file changes)
- Check logs in the console for debugging
- Set `LOG_LEVEL=debug` in `.env` for detailed logging
- The database schema is automatically created on first run

## Need Help?

- Check the `README.md` for detailed documentation
- Review `AI_AGENT_DOCUMENTATION.md` for AI features
- Check server logs for error messages

