# System Architecture Overview

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent Chat System                     │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)     │  Backend (Node.js)  │  Database (PG)   │
│  ┌─────────────────┐  │  ┌─────────────────┐ │  ┌─────────────┐  │
│  │ Chat Interface  │  │  │ Chat Controller│ │  │ PostgreSQL │  │
│  │ Sidebar         │  │  │ Gemini Service │ │  │ + Prisma   │  │
│  │ Markdown Render │  │  │ MCP Client     │ │  │             │  │
│  └─────────────────┘  │  │ Database Svc   │ │  └─────────────┘  │
│                       │  └─────────────────┘ │                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │    External Services     │
                    │  ┌─────────────────────┐ │
                    │  │   Google Gemini     │ │
                    │  │   MCP Server        │ │
                    │  │   Plan API          │ │
                    │  └─────────────────────┘ │
                    └─────────────────────────┘
```

## 🔄 Data Flow

1. **User Input** → Frontend → API Call → Backend
2. **Message Processing** → Database (Save) → AI Service → Response
3. **AI Integration** → Gemini API → AI Response → Database (Save) → Frontend
4. **MCP Integration** → MCP Context → Tool Selection → MCP Server → External API → Response

## 🛡️ Key Features

- **Retry Logic** with exponential backoff
- **Fallback Responses** when AI services are unavailable
- **Health Checks** for all external services
- **Graceful Degradation** for partial failures
- **Type Safety** with TypeScript throughout
- **Connection Pooling** for database performance

---

*For detailed implementation information, see [Technical Specifications](../SPECS.md)*
