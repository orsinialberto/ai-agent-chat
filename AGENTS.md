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
   - **If architectural changes**: Update relevant architecture documentation (see [Architecture Documentation Guidelines](#-architecture-documentation-guidelines))

5. **Commit**
   - Commit changes with descriptive message
   - Stop and wait for user to say proceed

### Behavior Rules

- **One step at a time**: Complete each phase before moving to the next
- **Wait for confirmation**: Don't proceed without user's OK
- **Working code**: Every commit must contain tested and working code
- **Updated documentation**: Always keep documentation synchronized
- **Continuous testing**: Verify everything works before proceeding

## 💡 Tips and Best Practices

### 1. **Modularity**
- Implement a plugin architecture for LLM providers
- Use dependency injection for services
- Keep layers separated (presentation, business, data)

### 2. **Error Handling**
- Implement retry logic for API calls with exponential backoff
- Return structured error codes (backend) and localized messages (frontend)
- Structured logging for debugging
- **Smart MCP error auto-correction:** When an MCP tool call fails, the system:
  1. Passes the error to the LLM along with the available MCP context
  2. The LLM analyzes the error and generates correct arguments
  3. Automatic retry up to 2 attempts
  4. If it fails, propagates error to frontend for localized message display
- **Multilingual error support**: Error messages automatically adapt to user's browser language (EN, IT, ES, FR, DE)

### 3. **Performance**
- Implement streaming for long responses
- Cache LLM configurations
- Pagination for historical messages

### 4. **User Experience**
- Loading indicators for AI responses
- Ability to cancel requests in progress
- Auto-save draft messages

### 5. **Testing**
- Unit tests for core services
- Integration tests for API endpoints
- E2E tests for complete chat flows

## 📝 README Guidelines

The `README.md` file should be kept **minimal and focused on getting started quickly**. It should contain only:

### Required Sections

1. **Quick Start**
   - Prerequisites
   - Installation steps
   - Running the application

2. **Configuration**
   - Environment variables (`.env` file setup)
   - MCP Server Configuration (if applicable)
   - Docker Commands (if applicable)

3. **Documentation Link**
   - Link to complete documentation for all other topics

### Update Process

When adding new features that require configuration:
1. Update README **only if** it affects Quick Start or Configuration sections
2. Add detailed documentation in `docs/` directory
3. Add a link to the detailed documentation in README's "Documentation" section

**Principle**: README = Quick Start Guide, everything else = Documentation

## 🏗️ Architecture Documentation Guidelines

When making architectural changes, the corresponding documentation **must** be updated to reflect the changes.

### Architecture Documentation Structure

The architecture documentation is organized in `docs/architecture/`:

- **[Overview](./docs/architecture/overview.md)** - High-level system architecture
- **[Frontend Architecture](./docs/architecture/frontend.md)** - Frontend structure, components, and patterns
- **[Backend Architecture](./docs/architecture/backend.md)** - Backend services, controllers, and API design

### When to Update Architecture Documentation

Update architecture documentation when making changes to:

#### Frontend Changes
- **Components**: Adding new components, changing component structure, or modifying component architecture
- **State Management**: Changes to React Query setup, new contexts, or state management patterns
- **Routing**: New routes, route protection changes, or navigation structure
- **Services**: New API services, changes to API client structure, or authentication flows
- **Styling**: Major styling architecture changes or new design system implementations

**Update**: `docs/architecture/frontend.md`

#### Backend Changes
- **Controllers**: New controllers, changes to controller structure, or endpoint modifications
- **Services**: New services, changes to service architecture, or business logic restructuring
- **Middleware**: New middleware, authentication changes, or request/response processing changes
- **Database**: Schema changes, new models, or database architecture modifications
- **API Design**: New endpoints, changes to API structure, or response format changes

**Update**: `docs/architecture/backend.md`

#### MCP Integration Changes
- **MCP Client**: Changes to MCP client implementation, protocol handling, or communication patterns
- **OAuth Integration**: OAuth authentication changes, token management, or OAuth flow modifications
- **Tool Execution**: Changes to tool call parsing, execution flow, or error handling
- **Configuration**: MCP configuration structure changes or new configuration options

**Update**: `docs/architecture/backend.md` (MCP section) and `docs/integrations/mcp-protocol.md`

#### System-Wide Changes
- **Authentication**: Changes to authentication flow, JWT handling, or security architecture
- **Data Flow**: Changes to overall data flow, request/response patterns, or system integration
- **External Services**: New integrations, changes to external service communication, or API changes
- **Infrastructure**: Deployment changes, Docker configuration, or infrastructure architecture

**Update**: `docs/architecture/overview.md` and relevant specific architecture documents

### Update Process

1. **Identify Affected Documentation**
   - Determine which architecture document(s) are affected by the change
   - Check if multiple documents need updates (e.g., authentication affects frontend, backend, and overview)

2. **Update Documentation**
   - Update the relevant architecture document(s) with the changes
   - Include code examples, diagrams, or flow descriptions as needed
   - Ensure documentation reflects the current implementation

3. **Update Cross-References**
   - Update links in `docs/architecture/overview.md` if needed
   - Update `docs/README.md` if new architecture sections are added
   - Ensure all references between documents are accurate

4. **Verify Consistency**
   - Ensure documentation matches the actual code implementation
   - Check that diagrams and descriptions are accurate
   - Verify all file paths and component names are correct

### Documentation Standards

- **Code Examples**: Include actual code snippets from the codebase (with line references when possible)
- **Diagrams**: Update ASCII diagrams to reflect structural changes
- **Flow Descriptions**: Document data flows, authentication flows, and request/response patterns
- **Configuration**: Document any new configuration options or requirements
- **Dependencies**: Update technology stack and dependency information

### Checklist for Architecture Changes

When making architectural changes, ensure:

- [ ] Relevant architecture document(s) updated
- [ ] Code examples reflect current implementation
- [ ] Diagrams updated to show new structure
- [ ] Flow descriptions accurate
- [ ] Cross-references between documents updated
- [ ] Technology stack information current
- [ ] Configuration options documented
- [ ] Related documentation (features, integrations) updated if needed

**Principle**: Architecture documentation must always reflect the current state of the codebase. Outdated documentation is worse than no documentation.