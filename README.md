# PWA Chat Application

This is a Next.js PWA chat application that uses PostgreSQL for data storage and Pusher for real-time communication.

## Database Setup

### Prerequisites

1. Install PostgreSQL on your local machine:
   - macOS (using Homebrew):
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. Create a local database:
   ```bash
   psql postgres
   CREATE DATABASE pwachat;
   ```

3. The default configuration uses:
   - Username: postgres
   - Password: postgres
   - Database: pwachat
   - Port: 5432

   If you need to change these settings, update the `DATABASE_URL` in your `.env` file.

### Database Schema

The application uses PostgreSQL with the following tables:
- `profiles`: User profiles and authentication
  - `id`: VARCHAR(256) PRIMARY KEY
  - `username`: VARCHAR(256) NOT NULL
  - `invite_key`: VARCHAR(256) UNIQUE
  - `created_at`: TIMESTAMP with DEFAULT
  - `last_seen`: TIMESTAMP with DEFAULT

- `messages`: Chat messages
  - `id`: SERIAL PRIMARY KEY
  - `user_id`: VARCHAR(256) REFERENCES profiles(id)
  - `username`: VARCHAR(256) NOT NULL
  - `content`: TEXT NOT NULL
  - `created_at`: TIMESTAMP with DEFAULT
  - `read_by`: VARCHAR(256)[] (Array of user IDs)

- `admins`: Administrator management
  - `profile_id`: VARCHAR(256) PRIMARY KEY REFERENCES profiles(id)
  - `created_at`: TIMESTAMP with DEFAULT

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database tables:
   ```bash
   npm run db:setup
   ```

3. Verify database connection:
   ```bash
   npm run test-db
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The application requires the following environment variables:

```env
# Pusher Configuration
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pwachat
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:setup`: Initialize database tables
- `npm run test-db`: Test database connection
- `npm run check-env`: Verify environment variables
- `npm run add-admin`: Add an admin user
