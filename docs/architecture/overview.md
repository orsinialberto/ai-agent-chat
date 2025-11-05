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
│  │ Auth (Login/Reg)│  │  │ Auth Service    │ │  │   Users     │ │
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
                    │  │   OAuth Server      │ │
                    │  │   Server API        │ │
                    │  └─────────────────────┘ │
                    └──────────────────────────┘
```

## 🔐 Authentication Flow

1. **User Registration/Login** → Frontend → Backend Auth Service
2. **Credential Verification** → Database (Users table) → Password Hash Check
3. **OAuth Token** (if MCP + OAuth enabled) → OAuth Server → Access Token
4. **JWT Generation** → Backend → JWT with user info + OAuth token (if applicable)
5. **Token Storage** → Frontend localStorage → Auto-injection in API requests
6. **Protected Routes** → Middleware verification → JWT validation → OAuth token check (if MCP)

## 🔄 Data Flow

1. **User Input** → Frontend → API Call (with JWT) → Backend
2. **Authentication** → JWT Middleware → User verification → Continue
3. **Message Processing** → Database (Save) → AI Service → Response
4. **AI Integration** → Gemini API → AI Response → Database (Save) → Frontend
5. **MCP Integration** → MCP Context → Tool Selection → MCP Server (with OAuth if configured) → External API → Response

## 📖 Detailed Architecture Documentation

For detailed architecture information, see:

- **[Frontend Architecture](./frontend.md)** - Complete frontend architecture, components, authentication flow, and state management
- **[Backend Architecture](./backend.md)** - Backend structure, services, authentication system, and API endpoints

## 🗄️ Database Schema

- **Users** - User accounts with authentication credentials
- **Chats** - Chat sessions linked to users
- **Messages** - Chat messages with roles (user, assistant, system)
- **LLMProvider** - LLM provider configurations (future)

See [Database Schema](./database-schema.md) for detailed schema documentation.

---