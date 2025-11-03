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

# JWT Configuration (REQUIRED for authentication)
JWT_SECRET="your_jwt_secret_change_this_in_production"
JWT_EXPIRES_IN="1h"

# OAuth Mock Server (OPTIONAL - only if using MCP with authentication)
OAUTH_SERVER_URL="http://localhost:9000"

# CORS
FRONTEND_URL="http://localhost:5173"
```

### Authentication

The application includes a complete authentication system:

**First Time Setup:**

1. Start the application (both backend and frontend)
2. Navigate to `http://localhost:5173/register`
3. Create an account with username, email, and password
4. You'll be automatically logged in and redirected to the chat

**Login:**

- All routes are protected and require authentication
- If not logged in, you'll be automatically redirected to `/login`
- Login with your username or email and password

**How it works:**

- **JWT tokens**: Used for frontend ↔ backend authentication (always required)
- **OAuth tokens**: Used for backend ↔ MCP server authentication (optional, only if MCP is configured)
- **Password security**: Passwords are hashed with bcrypt before storage
- **Auto-logout**: Token expiration triggers automatic logout

For detailed authentication documentation, see [`docs/features/authentication.md`](./docs/features/authentication.md).

### MCP Server Configuration

MCP (Model Context Protocol) server is configured via YAML file:

1. **Copy the example configuration:**
   ```bash
   cd backend
   cp config/mcp-config.yml.example config/mcp-config.yml
   ```

2. **Edit `backend/config/mcp-config.yml`** with your MCP server settings:
   ```yaml
   base_url: 'http://localhost:8080'
   timeout: 10000  # milliseconds
   retry_attempts: 3
   system_prompt: |
     Your custom system prompt here...
   tool_call_format: 'TOOL_CALL:toolName:{"param1":"value1"}'
   ```

3. **MCP is automatically enabled** if `mcp-config.yml` exists, otherwise it's disabled.

For detailed MCP configuration options, see `backend/config/mcp-config.yml.example`.

#### OAuth Authentication for MCP (Optional)

If your MCP server requires OAuth authentication:

1. **Enable MockServer** in `docker-compose.yml` (uncomment the `mockserver` service)
2. **Create OAuth config:**
   ```bash
   cd backend
   cp config/oauth-config.yml.example config/oauth-config.yml
   ```
3. **Start MockServer:**
   ```bash
   docker-compose up -d mockserver
   ```

The MockServer will respond to OAuth token requests at `http://localhost:9000/oauth/token` with a mock token.

For production, replace MockServer with your actual OAuth server URL in `oauth-config.yml`.

### Docker Commands

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Start PostgreSQL, pgAdmin, and MockServer (if MCP OAuth is needed)
docker-compose up -d postgres pgadmin mockserver

# Stop all services
docker-compose down

# View logs
docker-compose logs postgres
docker-compose logs pgadmin
docker-compose logs mockserver  # If using OAuth

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

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

For more information on testing, see [Testing Documentation](./docs/development/testing/README.md).

## API Examples

```bash
# Health check
curl http://localhost:3001/api/health

# Create chat
curl -X POST http://localhost:3001/api/chats \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat", "initialMessage": "Hello!"}'

# Send message
curl -X POST http://localhost:3001/api/chats/chat123/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello AI!", "role": "user"}'
```

## Contributing

See [AGENTS.md](./AGENTS.md) for development process and guidelines.

## Documentation

- [Documentation Overview](./docs/README.md)
- [Architecture Overview](./docs/architecture/overview.md) - System architecture and technology stack
- [Architecture Diagrams](./docs/architecture/diagrams.md)
- [Development Process](./AGENTS.md)
- [Technical Specifications](./SPECS.md) - Detailed technical specs
