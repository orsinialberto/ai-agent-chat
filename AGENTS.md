# AI Agent Chat - Development Process

## Project Overview

AI Agent Chat is a modern chat application with AI agents that supports multiple LLM providers and MCP integration.

### Technology Stack

**Backend:**
- Node.js + Express.js + TypeScript
- PostgreSQL + Prisma ORM
- Gemini API integration
- Docker + Docker Compose

**Frontend:**
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS
- React Query for state management

**Database:**
- PostgreSQL 15 (Docker)
- pgAdmin UI for database management
- Prisma schema with migrations

### Project Structure

```
ai-agent-chat/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   ├── prisma/              # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API calls
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utilities
│   │   └── styles/         # CSS styles
│   ├── package.json
│   └── vite.config.ts
├── shared/                  # Shared types between frontend/backend
│   └── types/
├── docs/                    # Documentation
├── docker-compose.yml       # PostgreSQL + pgAdmin
├── init.sql                 # Database initialization
├── README.md                # Setup and configuration guide
├── AGENTS.md                # Development process (this file)
└── SPECS.md                 # Technical specifications
```

## Development Process

### Standard Workflow for Each Feature

1. **Development**
   - Write code following specifications
   - Verify it works correctly

2. **Testing**
   - Write tests for the code
   - Run tests and verify they all pass

3. **Manual Testing**
   - Stop and wait for user to perform manual tests
   - User verifies everything works as expected

4. **Documentation**
   - Write documentation for the feature
   - Update existing documentation files

5. **Commit**
   - Commit changes with descriptive message
   - Stop and wait for user to say proceed

### Behavior Rules

- **One step at a time**: Complete each phase before moving to the next
- **Wait for confirmation**: Don't proceed without user's OK
- **Working code**: Every commit must contain tested and working code
- **Updated documentation**: Always keep documentation synchronized
- **Continuous testing**: Verify everything works before proceeding

