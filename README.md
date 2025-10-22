# AI Agent Chat

A modern chat application with AI agents that supports multiple LLM providers and MCP integration.

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (for PostgreSQL)
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd ai-agent-chat
   ```

2. **Start PostgreSQL and pgAdmin with Docker**
   ```bash
   docker-compose up -d
   ```
   - Database: `localhost:5432`
   - pgAdmin UI: `localhost:5050`

3. **Backend setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment file
   cp env.example .env
   # Edit .env with your database and API keys
   
   # Setup database
   npx prisma generate
   npx prisma db push
   ```

4. **Frontend setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start backend** (from backend directory)
   ```bash
   npm run dev
   ```
   Server runs on http://localhost:3001

2. **Start frontend** (from frontend directory)
   ```bash
   npm run dev
   ```
   App runs on http://localhost:5173

### Environment Variables

Create `.env` file in backend directory:

```env
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_agent_chat"

# Server
PORT=3001
NODE_ENV=development

# Gemini API
GEMINI_API_KEY="your_gemini_api_key"

# JWT
JWT_SECRET="your_jwt_secret"

# CORS
FRONTEND_URL="http://localhost:5173"
```

### Docker Commands

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs postgres
docker-compose logs pgadmin

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

### pgAdmin Setup

1. Access pgAdmin at `http://localhost:5050`
2. Login with:
   - Email: `admin@admin.com`
   - Password: `admin`
3. Add server connection:
   - Host: `postgres` (container name)
   - Port: `5432`
   - Database: `ai_agent_chat`
   - Username: `postgres`
   - Password: `postgres`

## Project Structure

```
ai-agent-chat/
├── backend/          # Express.js API server
├── frontend/         # React application
├── shared/           # Shared types and utilities
├── docs/             # Documentation
├── AGENTS.md         # Development process
└── SPECS.md          # Technical specifications
```

## Development Status

- ✅ **Phase 1**: Setup Base - Complete
- 🔄 **Phase 2**: Gemini Integration - In Progress
- ⏳ **Phase 3**: MCP Integration - Planned
- ⏳ **Phase 4**: Multi-LLM Support - Planned

## Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API status (coming soon)

## Contributing

See [AGENTS.md](./AGENTS.md) for development process and guidelines.

## Documentation

- [Technical Specifications](./SPECS.md)
- [Development Process](./AGENTS.md)
