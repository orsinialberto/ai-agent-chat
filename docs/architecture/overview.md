# System Architecture Overview

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent Chat System                     │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)     │  Backend (Node.js)   │  Database (PG)   │
│  ┌─────────────────┐  │  ┌─────────────────┐ │  ┌─────────────┐ │
│  │ Chat Interface  │  │  │ Chat Controller │ │  │ PostgreSQL  │ │
│  │ Sidebar         │  │  │ Gemini Service  │ │  │ + Prisma    │ │
│  │ Markdown Render │  │  │ MCP Client      │ │  │             │ │
│  └─────────────────┘  │  │ Database Svc    │ │  └─────────────┘ │
│                       │  └─────────────────┘ │                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │    External Services     │
                    │  ┌─────────────────────┐ │
                    │  │   Google Gemini     │ │
                    │  │   MCP Server        │ │
                    │  │   Server API        │ │
                    │  └─────────────────────┘ │
                    └──────────────────────────┘
```

## 🔄 Data Flow

1. **User Input** → Frontend → API Call → Backend
2. **Message Processing** → Database (Save) → AI Service → Response
3. **AI Integration** → Gemini API → AI Response → Database (Save) → Frontend
4. **MCP Integration** → MCP Context → Tool Selection → MCP Server → External API → Response

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Query** - State Management

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **TypeScript** - Type Safety
- **Prisma** - ORM
- **PostgreSQL** - Database

### Integrations
- **Google Gemini API** - LLM Provider
- **MCP Protocol** - External Tools
- **Docker** - Containerization

## 🛡️ Key Features

- **Retry Logic** with exponential backoff
- **Fallback Responses** when AI services are unavailable
- **Health Checks** for all external services
- **Graceful Degradation** for partial failures
- **Type Safety** with TypeScript throughout
- **Connection Pooling** for database performance

---

*For detailed implementation information, see [Technical Specifications](../SPECS.md)*
