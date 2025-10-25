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

# MCP Configuration
MCP_ENABLED=true
MCP_SERVER_URL=http://localhost:8080
MCP_TIMEOUT=10000
MCP_RETRY_ATTEMPTS=3
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
- ✅ **Phase 1**: Gemini Integration - Complete
- ✅ **Phase 1.5**: Chat Sidebar - Complete
- ✅ **Phase 2**: MCP Integration - Complete
- ⏳ **Phase 3**: Multi-LLM Support - Planned

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

### Core Endpoints
- `GET /health` - Health check
- `GET /api/test/gemini` - Test Gemini API connection

### Chat Endpoints
- `POST /api/chats` - Create new chat
- `GET /api/chats` - List all chats
- `GET /api/chats/:chatId` - Get specific chat
- `PUT /api/chats/:chatId` - Update chat title
- `DELETE /api/chats/:chatId` - Delete chat
- `POST /api/chats/:chatId/messages` - Send message to chat (with MCP integration)

### Health & Monitoring Endpoints
- `GET /api/health` - Health check generale
- `GET /api/health/detailed` - Health check dettagliato
- `GET /api/health/mcp` - Status MCP specifico
- `GET /api/test/mcp` - Test connessione MCP
- `GET /api/mcp/status` - Status MCP dal chat controller

### Example Usage

```bash
# Test Gemini connection
curl http://localhost:3001/api/test/gemini

# Test Gemini error handling
curl http://localhost:3001/api/test/gemini/error-handling

# Test MCP connection
curl http://localhost:3001/api/test/mcp

# Check health status
curl http://localhost:3001/api/health

# Create a new chat
curl -X POST http://localhost:3001/api/chats \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat", "initialMessage": "Hello!"}'

# Send a message (with MCP integration)
curl -X POST http://localhost:3001/api/chats/chat123/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Mostrami tutti i segmenti per il tenant 12992", "role": "user"}'
```

## Contributing

See [AGENTS.md](./AGENTS.md) for development process and guidelines.

## Documentation

- [Technical Specifications](./SPECS.md)
- [Architecture Diagrams](./docs/architecture-diagrams.md)
- [Development Process](./AGENTS.md)
