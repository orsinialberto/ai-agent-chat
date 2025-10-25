# Architettura del Sistema - AI Agent Chat

Questo documento contiene i diagrammi di architettura del progetto AI Agent Chat, che mostrano la struttura del sistema, i flussi di dati e le integrazioni tra i componenti.

## 📋 Indice

1. [Architettura Generale](#1-architettura-generale)
2. [Flusso Dati Chat](#2-flusso-dati-chat)
3. [Architettura Backend](#3-architettura-backend)
4. [Architettura Frontend](#4-architettura-frontend)
5. [Integrazione MCP](#5-integrazione-mcp)
6. [Schema Database](#6-schema-database)
7. [Deployment](#7-deployment)
8. [Flusso MCP Integration](#8-flusso-mcp-integration)

---

## 1. Architettura Generale

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

**Descrizione**: Questo diagramma mostra l'architettura generale del sistema, evidenziando i layer principali (Client, Backend, Database) e le loro interazioni con servizi esterni.

---

## 2. Flusso Dati Chat

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

**Descrizione**: Questo diagramma di sequenza mostra il flusso completo di un messaggio utente, dalla ricezione alla risposta AI, includendo la gestione dell'integrazione MCP.

---

## 3. Architettura Backend

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

**Descrizione**: Architettura dettagliata del backend, mostrando la separazione tra controllers, services, middleware e database layer.

---

## 4. Architettura Frontend

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

**Descrizione**: Struttura del frontend React, mostrando i componenti, hooks personalizzati e servizi per la gestione dello stato e delle API.

---

## 5. Integrazione MCP

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

**Descrizione**: Dettaglio dell'integrazione MCP (Model Context Protocol), mostrando come il sistema si connette a server MCP esterni per estendere le funzionalità AI.

---

## 6. Schema Database

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

**Descrizione**: Schema del database PostgreSQL, mostrando le tabelle principali e le loro relazioni per la gestione di chat, messaggi e provider LLM.

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

**Descrizione**: Ambiente di sviluppo con Docker Compose, mostrando i servizi locali e le connessioni ai servizi esterni.

---

## 8. Flusso MCP Integration

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

**Descrizione**: Flusso dettagliato dell'integrazione MCP, mostrando come il sistema decide quando utilizzare i tool MCP e come gestisce le risposte.

---

## 🔧 Tecnologie Utilizzate

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - State management

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database

### Integrazioni
- **Google Gemini API** - LLM Provider
- **MCP (Model Context Protocol)** - External Tools
- **Docker Compose** - Development Environment

### Database
- **PostgreSQL 15** - Primary database
- **pgAdmin** - Database management UI

---

## 📚 Documentazione Correlata

- [Specifiche Tecniche](../SPECS.md) - Dettagli tecnici del progetto
- [Processo di Sviluppo](../AGENTS.md) - Workflow di sviluppo
- [Setup e Configurazione](../README.md) - Guida all'installazione
- [Integrazione Gemini](./gemini-integration.md) - Dettagli integrazione Gemini
- [Chat Sidebar](./chat-sidebar.md) - Funzionalità sidebar
- [Supporto Markdown](./markdown-support.md) - Rendering messaggi

---

*Ultimo aggiornamento: Dicembre 2024*
