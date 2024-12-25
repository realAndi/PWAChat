# PWA Chat Application

<div align="center">
  <img src="https://github.com/realAndi/PWAChat/blob/master/src/imgs/appicon.png?raw=true" alt="PWAChat Logo" width="100" height="100">
  <h1>PWA Chat</h1>
</div>

<p align="center">
A real-time Progressive Web App chat application built with Next.js, PostgreSQL, and Pusher. Features include user management, real-time messaging, read receipts, and admin controls.
</p>

## Features

- 💬 Real-time messaging with Pusher
- 👥 User profiles and authentication
- ✅ Message read receipts
- 🔐 Admin management system
- 📱 Progressive Web App (PWA) support
- 🌓 Dark/Light mode support

## Database Structure

The application uses PostgreSQL with three main tables:

### Profiles Table
```sql
CREATE TABLE profiles (
  id VARCHAR(256) PRIMARY KEY,
  username VARCHAR(256) NOT NULL,
  invite_key VARCHAR(256) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(256) REFERENCES profiles(id),
  username VARCHAR(256) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_by VARCHAR(256)[] DEFAULT ARRAY[]::VARCHAR(256)[]
);
```

### Admins Table
```sql
CREATE TABLE admins (
  profile_id VARCHAR(256) PRIMARY KEY REFERENCES profiles(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Getting Started

### Prerequisites

1. Node.js 18+ and npm
2. PostgreSQL 14+
3. Pusher account for real-time features

### Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://[user]:[password]@localhost:5432/pwachat

# Pusher Configuration
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/realAndi/PWAChat.git
   cd PWAChat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:setup
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database Management
- `npm run db:setup` - Initialize database tables
- `npm run test-db` - Test database connection
- `npm run check-env` - Verify environment variables

### User Management
- `npm run add-admin` - Add an admin user
- `npm run generate-invite` - Generate a new invite key
- `npm run regenerate-invite` - Regenerate an invite key for a user
- `npm run remove-user` - Remove a user from the system

### Maintenance
- `npm run clear-invites` - Clear unused invite keys
- `npm run clear-chat` - Clear chat history
- `npm run clear-tickets` - Clear tickets

## Admin Commands

Here are some useful SQL commands for administrators:

### View User Statistics
```sql
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
       COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered_users
FROM profiles;
```

### View Message Statistics
```sql
SELECT 
    COUNT(*) as total_messages,
    COUNT(DISTINCT user_id) as unique_senders,
    MIN(created_at) as first_message_date,
    MAX(created_at) as last_message_date
FROM messages;
```

### View Admin Users
```sql
SELECT p.username, p.created_at 
FROM admins a 
JOIN profiles p ON a.profile_id = p.id;
```

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Real-time**: Pusher
- **State Management**: Zustand
- **Styling**: Tailwind CSS with shadcn/ui components
- **Type Safety**: TypeScript

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
