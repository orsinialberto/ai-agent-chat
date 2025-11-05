# Backend Architecture

## 📋 Overview

The backend is a Node.js/Express application built with TypeScript, providing RESTful API endpoints for the chat application. It integrates with PostgreSQL database, Google Gemini API, and optionally with MCP (Model Context Protocol) servers.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  index.ts    │  │  Middleware  │  │   Routes     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                  │                  │         │
│  ┌──────▼──────────────────▼──────────────────▼──────┐  │
│  │            Controllers Layer                      │  │
│  │  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │ChatController│  │AuthController│               │  │
│  │  └──────────────┘  └──────────────┘               │  │
│  └───────────────────────────────────────────────────┘  │
│         │                                               │
│  ┌──────▼─────────────────────────────────────────────┐ │
│  │            Services Layer                          │ │
│  │  ┌─────────────┐  ┌───────────────┐  ┌────────────┐│ │
│  │  │geminiService│  │databaseService│  │authService ││ │
│  │  └─────────────┘  └───────────────┘  └────────────┘│ │
│  └────────────────────────────────────────────────────┘ │
│         │                  │                  │         │
│  ┌──────▼──────────────────▼──────────────────▼──────┐  │
│  │  PostgreSQL  │  Gemini API  │  MCP Server (opt)   │  │
│  └──────────────┴──────────────┴─────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Core Technologies
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **Prisma** - ORM for database access

### Key Libraries
- **@google/generative-ai** - Google Gemini API client
- **@prisma/client** - Prisma ORM client
- **jsonwebtoken** - JWT token handling
- **bcrypt** - Password hashing
- **cors** - CORS middleware
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **dotenv** - Environment variables

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/                # Route handlers
│   │   ├── chatController.ts
│   │   └── authController.ts
│   ├── services/                   # Business logic
│   │   ├── geminiService.ts
│   │   ├── databaseService.ts
│   │   ├── authService.ts
│   │   ├── mcpClient.ts
│   │   └── mcpContextService.ts
│   ├── middleware/                 # Express middleware
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   ├── routes/                     # Route definitions
│   │   └── auth.ts
│   ├── config/                     # Configuration files
│   │   ├── mcpConfig.ts
│   │   └── oauthConfig.ts
│   ├── types/                      # TypeScript types
│   │   └── shared.ts
│   ├── utils/                      # Utility functions
│   │   └── database.ts
│   └── index.ts                    # Entry point
├── prisma/
│   └── schema.prisma               # Database schema
├── config/
│   ├── mcp-config.yml.example
│   └── oauth-config.yml.example
├── package.json
└── tsconfig.json
```

## 🔐 Authentication System

### Architecture

The authentication system uses JWT (JSON Web Tokens) for frontend-backend communication and optionally OAuth tokens for backend-MCP server communication.

```
Frontend ←→ Backend (JWT) ←→ MCP Server (OAuth - optional)
```

### Components

#### 1. **AuthService** (`services/authService.ts`)

Core authentication service

**Login Flow:**
1. Verify credentials (username/email + password)
2. If MCP enabled AND OAuth configured:
   - Call OAuth server to get access token
   - Calculate OAuth token expiry
3. Generate JWT with:
   - `userId`, `username`, `email`
   - `oauthToken` (if MCP + OAuth enabled)
   - `oauthTokenExpiry` (if OAuth enabled)
4. Return JWT to frontend

#### 2. **Auth Middleware** (`middleware/authMiddleware.ts`)

Protects routes by verifying JWT tokens

**Applied to:**
- `POST /api/chats`
- `GET /api/chats`
- `GET /api/chats/:id`
- `PUT /api/chats/:id`
- `DELETE /api/chats/:id`
- `POST /api/chats/:id/messages`

#### 3. **Auth Controller** (`controllers/authController.ts`)

Handles authentication endpoints:

| Endpoint             | Method | Auth Required | Description           |
|----------------------|--------|---------------|-----------------------|
| `/api/auth/register` | POST   | No            | Register new user     |
| `/api/auth/login`    | POST   | No            | User login            |
| `/api/auth/logout`   | POST   | Yes           | Logout (clears token) |
| `/api/auth/me`       | GET    | Yes           | Get current user info |

### Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Secret**: Stored in environment variable
- **Token Expiration**: Configurable (default: 1h)
- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **CORS**: Configured for frontend origin only

## 💬 Chat System

### Chat Controller (`controllers/chatController.ts`)

Main controller for chat operations:

#### **createChat()**
- Creates new chat in database
- Associates chat with authenticated user
- If initial message provided:
  - Adds user message
  - Gets AI response
  - Adds assistant message
- Returns chat with messages

#### **getChats()**
- Retrieves all chats for authenticated user
- Returns list of chats with metadata

#### **getChat()**
- Retrieves single chat by ID
- Verifies user owns the chat
- Returns chat with all messages

#### **sendMessage()**
- Adds user message to chat
- Gets chat history
- If MCP enabled:
  - Gets MCP tools context
  - Sends to Gemini with MCP context
  - Parses tool calls from response
  - Executes tool calls
  - Generates final response
- Else:
  - Sends to Gemini without MCP
- Saves assistant response
- Returns assistant message

#### **updateChat()**
- Updates chat title
- Verifies user ownership

#### **deleteChat()**
- Deletes chat and all messages (cascade)
- Verifies user ownership

## 🤖 Gemini Integration

### Gemini Service (`services/geminiService.ts`)

Manages Google Gemini API integration

**Features:**
- Model switching support
- Retry logic with exponential backoff
- Fallback responses on errors
- Streaming support (future)

## 🗄️ Database

### Database Service (`services/databaseService.ts`)

Prisma-based database operations

### Database Schema

See [Database Schema](./database-schema.md) for detailed schema documentation.

**Key Models:**
- **User**: Users table with authentication info
- **Chat**: Chats table linked to users
- **Message**: Messages table linked to chats
- **LLMProvider**: LLM provider configuration (future)

## 🔌 MCP Integration

### MCP Client (`services/mcpClient.ts`)

JSON-RPC 2.0 client for MCP server communication

### MCP Context Service (`services/mcpContextService.ts`)

Manages MCP context for LLM

**Configuration:**
- MCP is enabled if `backend/config/mcp-config.yml` exists
- Configuration loaded from YAML file
- OAuth token (if configured) passed to MCP client

For detailed MCP documentation, see [MCP Protocol Integration](../integrations/mcp-protocol.md).

## 🛡️ Middleware

### Security Middleware

1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Rate Limiting**: 1000 requests per 15 minutes per IP
4. **Authentication**: JWT verification (see above)

### Error Handling

**Error Handler** (`middleware/errorHandler.ts`):
- Centralized error handling
- Structured error responses
- Logging for debugging

### Logger

**Logger** (`middleware/logger.ts`):
- Request logging
- Error logging
- Performance metrics

## 🚀 API Endpoints

### Authentication Endpoints

| Endpoint             | Method | Auth | Description       |
|----------------------|--------|------|-------------------|
| `/api/auth/register` | POST   | No   | Register new user |
| `/api/auth/login`    | POST   | No   | User login        |
| `/api/auth/logout`   | POST   | Yes  | Logout            |
| `/api/auth/me`       | GET    | Yes  | Get current user  |

### Chat Endpoints

| Endpoint                  | Method | Auth | Description          |
|---------------------------|--------|------|----------------------|
| `/api/chats`              | POST   | Yes  | Create new chat      |
| `/api/chats`              | GET    | Yes  | Get all user's chats |
| `/api/chats/:id`          | GET    | Yes  | Get chat by ID       |
| `/api/chats/:id`          | PUT    | Yes  | Update chat          |
| `/api/chats/:id`          | DELETE | Yes  | Delete chat          |
| `/api/chats/:id/messages` | POST   | Yes  | Send message         |

### Health Check

| Endpoint      | Method | Auth | Description  |
|---------------|--------|------|--------------|
| `/api/health` | GET    | No   | Health check |

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Token expiration checking
- User ownership verification for resources

### Input Validation
- Request body validation
- Parameter sanitization
- SQL injection prevention (Prisma)

### Rate Limiting
- 1000 requests per 15 minutes per IP
- Prevents abuse and DDoS

### Security Headers
- Helmet.js for security headers
- CORS configuration
- XSS protection

## 📊 Error Handling

### Error Types

- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: User doesn't own resource
- **404 Not Found**: Resource not found
- **400 Bad Request**: Invalid input
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: External service unavailable (e.g., Gemini API)

### Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "errorType": "ERROR_TYPE" // Optional
}
```

## 🧪 Testing

See [Backend Testing Documentation](../development/testing/backend-testing.md) for details.

## 📚 Related Documentation

- [Authentication System](../features/authentication.md) - Complete authentication documentation
- [MCP Protocol Integration](../integrations/mcp-protocol.md) - MCP integration details
- [Database Schema](./database-schema.md) - Database structure
- [Error Handling](../features/error-handling-v2.md) - Error handling implementation

