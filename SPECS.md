# Documento di Sviluppo - AI Agent Chat

## 🎯 Panoramica del Progetto

Un sistema di chat interattivo con AI Agent che supporta multiple fasi di sviluppo, diversi LLM e integrazione MCP (Model Context Protocol).

## 📋 Fasi di Sviluppo

### **Fase 1: Gemini Integration**
- Frontend React con interfaccia chat
- Backend Node.js con API REST
- Database PostgreSQL per persistenza chat
- Integrazione diretta con Gemini API

### **Fase 2: MCP Server Integration**
- Connessione al server MCP (stdio o HTTP)
- Estensione dell'agent per utilizzare tools MCP
- Gestione dinamica delle funzionalità disponibili

### **Fase 3: Multi-LLM Support**
- Sistema modulare per diversi provider LLM
- Interfaccia per selezione LLM in tempo reale
- Gestione unificata delle diverse API

## 🏗️ Architettura Tecnica

### Stack Tecnologico
```
Frontend: React 18 + TypeScript + Vite
Backend: Node.js + Express + TypeScript
Database: PostgreSQL + Prisma ORM
LLM: Gemini API (Fase 1) → Multi-LLM (Fase 3)
MCP: Custom MCP Client (Fase 2)
```

### Struttura Progetto
```
ai-agent-chat/
├── frontend/                 # React App
│   ├── src/
│   │   ├── components/       # Componenti UI
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API calls
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Node.js API
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
├── shared/                  # Tipi condivisi
│   └── types/
└── docs/                    # Documentazione
```

## 🗄️ Schema Database

### Tabelle Principali
```sql
-- Chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role ENUM('user', 'assistant', 'system'),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- LLM Providers (Fase 3)
CREATE TABLE llm_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type ENUM('gemini', 'openai', 'anthropic', 'mcp'),
  config JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Sicurezza e Configurazione

### Variabili d'Ambiente
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_agent_chat"

# Gemini API
GEMINI_API_KEY="your_gemini_api_key"

# MCP Server (Fase 2)
MCP_SERVER_PATH="/path/to/mcp/server"
MCP_SERVER_ARGS="--config config.json"

# JWT
JWT_SECRET="your_jwt_secret"
```

### Middleware Sicurezza
```typescript
// Rate limiting
const rateLimiter = rateLimit({
  windowMs: Azure SQL Database,
  max: 100 // 100 richieste per finestra
});

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## 📦 Dipendenze Principali

### Frontend
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.3.0"
  }
}
```

### Backend
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.0.0",
    "@google/generative-ai": "^0.1.0"
  }
}
```

## 🚀 Roadmap di Sviluppo

### Settimana 1-2: Setup Base
- [x] Configurazione ambiente di sviluppo
- [x] Setup database PostgreSQL + Prisma
- [x] Struttura base backend Express
- [x] Struttura base frontend React

### Settimana 3-4: Fase 1 - Gemini
- [ ] Integrazione Gemini API
- [ ] Implementazione chat persistente
- [ ] Interfaccia utente base
- [ ] Test end-to-end

### Settimana 5-6: Fase 2 - MCP
- [ ] Implementazione MCP client
- [ ] Estensione agent con tools
- [ ] Gestione dinamica funzionalità
- [ ] Testing MCP integration

### Settimana 7-8: Fase 3 - Multi-LLM
- [ ] Architettura modulare LLM
- [ ] Implementazione provider multipli
- [ ] UI per selezione LLM
- [ ] Configurazione dinamica

## 💡 Suggerimenti e Best Practices

### 1. **Modularità**
- Implementa un'architettura a plugin per i provider LLM
- Usa dependency injection per i servizi
- Mantieni separati i layer (presentation, business, data)

### 2. **Gestione Errori**
- Implementa retry logic per chiamate API
- Fallback graceful quando un LLM non è disponibile
- Logging strutturato per debugging

### 3. **Performance**
- Implementa streaming per risposte lunghe
- Cache delle configurazioni LLM
- Paginazione per messaggi storici

### 4. **User Experience**
- Indicatori di caricamento per risposte AI
- Possibilità di cancellare richieste in corso
- Auto-save dei messaggi in bozza

### 5. **Testing**
- Unit test per servizi core
- Integration test per API endpoints
- E2E test per flussi chat completi

## 🔍 Considerazioni Aggiuntive

### **MCP Server Integration**
Per la Fase 2, considera:
- **Stdio vs HTTP**: Stdio è più performante per processi locali, HTTP per server remoti
- **Gestione connessioni**: Implementa connection pooling e retry logic
- **Tool discovery**: Cache dinamica dei tools disponibili

### **Multi-LLM Strategy**
- **Cost optimization**: Routing intelligente basato su costo/performance
- **A/B testing**: Possibilità di testare diversi LLM per la stessa query
- **Load balancing**: Distribuzione del carico tra provider

---

**Nota**: Durante lo sviluppo, la documentazione sarà concisa e focalizzata sui concetti essenziali, evitando verbosità eccessiva.
