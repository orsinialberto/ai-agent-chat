# System Architecture - AI Agent Chat

This document contains the architecture diagrams for the AI Agent Chat project, showing the system structure, data flows, and component integrations.

## 📋 Table of Contents

1. [General Architecture](#1-general-architecture)
2. [Chat Data Flow](#2-chat-data-flow)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [MCP Integration](#5-mcp-integration)
6. [Database Schema](#6-database-schema)
7. [Deployment](#7-deployment)
8. [MCP Integration Flow](#8-mcp-integration-flow)
9. [MCP Error Auto-Correction Flow](#9-mcp-error-auto-correction-flow)

---

## 1. General Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend<br/>TypeScript + Vite<br/>Tailwind CSS]
        UI --> |HTTP/REST| API[Express.js Backend<br/>Node.js + TypeScript]
    end
    
    subgraph "Backend Services"
        API --> |Prisma ORM| DB[(PostgreSQL Database<br/>Docker Container)]
        API --> |HTTP/JSON-RPC| MCP[MCP Server<br/>External Tools]
        API --> |REST API| GEMINI[Google Gemini API<br/>LLM Provider]
    end
    
    subgraph "External Services"
        MCP
        GEMINI
    end
    
    subgraph "Infrastructure"
        DOCKER[Docker Compose<br/>PostgreSQL + pgAdmin]
        DOCKER --> DB
    end
    
    subgraph "Development Tools"
        PGADMIN[pgAdmin UI<br/>Database Management<br/>localhost:5050]
        PGADMIN --> DB
    end
```

**Description**: This diagram shows the general system architecture, highlighting the main layers (Client, Backend, Database) and their interactions with external services.

---

## 2. Chat Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database
    participant G as Gemini API
    participant M as MCP Server
    
    U->>F: Send Message
    F->>B: POST /api/chats/:id/messages
    B->>D: Save User Message
    D-->>B: Message Saved
    
    alt MCP Enabled
        B->>M: Get Available Tools
        M-->>B: Tools List
        B->>G: Send Message + MCP Context
    else MCP Disabled
        B->>G: Send Message
    end
    
    G-->>B: AI Response
    B->>D: Save AI Response
    D-->>B: Response Saved
    B-->>F: Return Chat Data
    F-->>U: Display Response
```

**Description**: This sequence diagram shows the complete flow of a user message, from reception to AI response, including MCP integration management.

---

## 3. Backend Architecture

```mermaid
graph TB
    subgraph "Express.js Backend"
        subgraph "Controllers"
            CC[ChatController<br/>Chat Management]
            HC[HealthController<br/>System Health]
        end
        
        subgraph "Services"
            GS[GeminiService<br/>LLM Integration]
            DS[DatabaseService<br/>Data Persistence]
            MC[MCPClient<br/>External Tools]
            MCS[MCPContextService<br/>Tool Context]
        end
        
        subgraph "Middleware"
            EH[ErrorHandler<br/>Error Management]
            L[Logger<br/>Request Logging]
            RL[RateLimiter<br/>Request Throttling]
        end
        
        subgraph "Database Layer"
            P[Prisma ORM<br/>Type-safe DB Access]
        end
    end
    
    CC --> GS
    CC --> DS
    CC --> MC
    CC --> MCS
    DS --> P
    MC --> |JSON-RPC| MCP[MCP Server]
    GS --> |REST API| GEMINI[Gemini API]
    P --> |SQL| DB[(PostgreSQL)]
```

**Description**: Detailed backend architecture, showing the separation between controllers, services, middleware, and database layer.

---

## 4. Frontend Architecture

```mermaid
graph TB
    subgraph "React Frontend"
        subgraph "Components"
            CI[ChatInterface<br/>Main Chat UI]
            SB[Sidebar<br/>Chat Navigation]
            CL[ChatList<br/>Chat History]
            CI2[ChatItem<br/>Individual Chat]
            NC[NewChatButton<br/>Create Chat]
            DM[DeleteModal<br/>Chat Deletion]
        end
        
        subgraph "Hooks"
            UH[useChat<br/>Chat State Management]
            US[useSidebar<br/>Sidebar State]
        end
        
        subgraph "Services"
            API[API Service<br/>HTTP Client]
        end
        
        subgraph "Styling"
            TW[Tailwind CSS<br/>Utility Classes]
            MD[Markdown Renderer<br/>Message Formatting]
        end
    end
    
    CI --> UH
    SB --> US
    SB --> CL
    CL --> CI2
    UH --> API
    US --> API
    API --> |HTTP| BACKEND[Backend API]
```

**Description**: React frontend structure, showing components, custom hooks, and services for state management and API handling.

---

## 5. MCP Integration

```mermaid
graph LR
    subgraph "AI Agent Chat System"
        subgraph "Backend"
            CC[ChatController]
            MC[MCPClient]
            MCS[MCPContextService]
            GS[GeminiService]
        end
        
        subgraph "Database"
            DB[(PostgreSQL<br/>Chat & Messages)]
        end
    end
    
    subgraph "External MCP Server"
        MS[MCP Server<br/>JSON-RPC 2.0]
        T1[Tool 1<br/>Database Query]
        T2[Tool 2<br/>File Operations]
        T3[Tool N<br/>Custom Functions]
    end
    
    CC --> MC
    MC --> |JSON-RPC| MS
    MCS --> MC
    CC --> MCS
    CC --> GS
    CC --> DB
    
    MS --> T1
    MS --> T2
    MS --> T3
    
    GS --> |Enhanced Context| GEMINI[Google Gemini API]
    MCS --> |Tool Context| GS
```

**Description**: Detail of MCP (Model Context Protocol) integration, showing how the system connects to external MCP servers to extend AI capabilities.

---

## 6. Database Schema

```mermaid
erDiagram
    CHATS {
        string id PK
        string title
        datetime createdAt
        datetime updatedAt
    }
    
    MESSAGES {
        string id PK
        string chatId FK
        enum role
        string content
        json metadata
        datetime createdAt
    }
    
    LLM_PROVIDERS {
        string id PK
        string name
        enum type
        json config
        boolean active
        datetime createdAt
    }
    
    CHATS ||--o{ MESSAGES : "has many"
    LLM_PROVIDERS ||--o{ CHATS : "serves"
```

**Description**: PostgreSQL database schema, showing the main tables and their relationships for managing chats, messages, and LLM providers.

---

## 7. Deployment

```mermaid
graph TB
    subgraph "Development Environment"
        subgraph "Docker Compose"
            POSTGRES[PostgreSQL 15<br/>Port: 5432]
            PGADMIN[pgAdmin 4<br/>Port: 5050]
        end
        
        subgraph "Backend Development"
            BACKEND[Node.js Backend<br/>Port: 3001<br/>TypeScript + Express]
        end
        
        subgraph "Frontend Development"
            FRONTEND[React Frontend<br/>Port: 5173<br/>Vite + TypeScript]
        end
        
        subgraph "External Services"
            GEMINI[Google Gemini API<br/>External]
            MCP_SERVER[MCP Server<br/>External<br/>Port: 8080]
        end
    end
    
    FRONTEND --> |HTTP| BACKEND
    BACKEND --> |Prisma ORM| POSTGRES
    BACKEND --> |REST API| GEMINI
    BACKEND --> |JSON-RPC| MCP_SERVER
    PGADMIN --> |Web UI| POSTGRES
```

**Description**: Development environment with Docker Compose, showing local services and connections to external services.

---

## 8. MCP Integration Flow

```mermaid
flowchart TD
    START[User Sends Message] --> CHECK{MCP Enabled?}
    
    CHECK -->|Yes| GET_TOOLS[Get Available MCP Tools]
    CHECK -->|No| DIRECT_GEMINI[Send to Gemini Directly]
    
    GET_TOOLS --> BUILD_CONTEXT[Build MCP Context]
    BUILD_CONTEXT --> ENHANCED_PROMPT[Enhanced Prompt with Tools]
    ENHANCED_PROMPT --> GEMINI_CALL[Call Gemini with Context]
    
    DIRECT_GEMINI --> GEMINI_CALL
    GEMINI_CALL --> PARSE_RESPONSE[Parse Gemini Response]
    
    PARSE_RESPONSE --> TOOL_CALL{Contains Tool Call?}
    TOOL_CALL -->|Yes| EXECUTE_TOOL[Execute MCP Tool]
    TOOL_CALL -->|No| SAVE_RESPONSE[Save AI Response]
    
    EXECUTE_TOOL --> TOOL_RESULT[Get Tool Result]
    TOOL_RESULT --> FINAL_RESPONSE[Generate Final Response]
    FINAL_RESPONSE --> SAVE_RESPONSE
    
    SAVE_RESPONSE --> RETURN[Return to User]
```

**Description**: Detailed MCP integration flow, showing how the system decides when to use MCP tools and how it handles responses.

---

## 9. MCP Error Auto-Correction Flow

```mermaid
flowchart TD
    START[User Sends Message] --> PROCESS[Process Message with MCP Context]
    PROCESS --> GEMINI[Send to Gemini with Tools Context]
    GEMINI --> PARSE{Parse Response}
    
    PARSE -->|Has Tool Call| EXECUTE[Execute MCP Tool]
    PARSE -->|No Tool Call| DIRECT[Direct AI Response]
    
    EXECUTE --> SUCCESS{Success?}
    
    SUCCESS -->|Yes| RESULT[Get Tool Result]
    SUCCESS -->|No| ERROR_ANALYSIS[Analyze Error Message]
    
    RESULT --> FINAL[Generate Final Response with LLM]
    FINAL --> SAVE[Save AI Response]
    DIRECT --> SAVE
    SAVE --> RETURN[Return to User]
    
    ERROR_ANALYSIS --> CHECK_RETRY{Retry Count < 2?}
    
    CHECK_RETRY -->|Yes| LLM_CORRECTION[Pass Error to LLM for Analysis]
    CHECK_RETRY -->|No| DETECT_LANG[Detect User Language]
    
    LLM_CORRECTION --> CORRECTION_PROMPT[Build Correction Prompt:<br/>Error message + MCP context + Available tools]
    CORRECTION_PROMPT --> ASK_LLM[Ask LLM to Fix Arguments]
    
    ASK_LLM --> EXTRACT{Extract<br/>Corrected Tool Call?}
    
    EXTRACT -->|Success| FIXED_ARGS[Use Fixed Arguments]
    EXTRACT -->|Failure| DETECT_LANG
    
    FIXED_ARGS --> RETRY[Retry with Corrected Arguments]
    RETRY --> EXECUTE
    
    DETECT_LANG --> GENERIC_ERROR[Return Generic Error Message<br/>in User's Language]
    GENERIC_ERROR --> RETURN
    
    style ERROR_ANALYSIS fill:#ffcccc
    style LLM_CORRECTION fill:#ffffcc
    style GENERIC_ERROR fill:#ffe6e6
```

**Description**: This diagram shows the intelligent error auto-correction flow when MCP tool calls fail. The system uses the LLM itself to analyze errors and automatically retry with corrected arguments, supporting up to 2 retry attempts before returning a user-friendly error message in the user's detected language.

---

## 📚 Related Documentation

- [Technical Specifications](../SPECS.md) - Project technical details
- [Development Process](../AGENTS.md) - Development workflow
- [Setup and Configuration](../README.md) - Installation guide
- [Gemini Integration](./gemini-integration.md) - Gemini integration details
- [Chat Sidebar](./chat-sidebar.md) - Sidebar functionality
- [Markdown Support](./markdown-support.md) - Message rendering

---

*Last updated: December 2024*
