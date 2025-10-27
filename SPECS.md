# Documento di Sviluppo - AI Agent Chat

## 🎯 Panoramica del Progetto

Un sistema di chat interattivo con AI Agent che supporta multiple fasi di sviluppo, diversi LLM e integrazione MCP (Model Context Protocol).

## 🏗️ Architettura Tecnica

> 📊 **Diagrammi di Architettura**: Per una rappresentazione visuale completa dell'architettura del sistema, consulta [Architecture Diagrams](./docs/architecture/diagrams.md).

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

### Setup Base
- [x] Configurazione ambiente di sviluppo
- [x] Setup database PostgreSQL + Prisma
- [x] Struttura base backend Express
- [x] Struttura base frontend React

### Fase 1 - Gemini
- [x] Integrazione Gemini API
- [x] Implementazione chat persistente
- [x] Interfaccia utente base
- [x] Test end-to-end

### Fase 1.5 - Chat Sidebar ✅
- [x] Sidebar component con lista chat
- [x] Navigazione tra chat esistenti
- [x] Gestione chat (crea/elimina)
- [x] Design responsive
- [x] Test integrazione sidebar

### Fase 2 - MCP
- [x] Implementazione MCP client
- [x] Estensione agent con tools
- [x] Gestione dinamica funzionalità
- [x] Testing MCP integration

### Fase 3 - MCP Tool Call Parser Fix ✅
- [x] Fix parsing tool calls con JSON annidati (brace counting)
- [x] Gestione strutture JSON complesse in tool call arguments
- [x] Implementazione gestione errori migliorata con auto-correzione LLM
- [ ] Migrazione a @modelcontextprotocol/sdk per parsing robusto
- [ ] Test con strutture JSON deep

### Fase 3.5 - Ottimizzazioni e Fix Tecnici
- [ ] Fix errori build backend (npm run build)
- [ ] Fix errori build frontend (npm run build)
- [ ] Implementare cache per MCP tool/list
  - [ ] Valutare best practice per caching tools disponibili
  - [ ] Implementare sistema cache con TTL
  - [ ] Gestire refresh automatico cache
- [ ] Slegare prompt MCP dal backend
  - [ ] Valutare approccio: esterno vs server MCP endpoint
  - [ ] Implementare caricamento dinamico prompt
  - [ ] Definire best practice architetturale
- [ ] Cleanup log e debug MCP
  - [ ] Rimuovere/movare a debug i log verbose
  - [ ] Mantenere solo log essenziali
- [ ] Verificare troncamento risposte MCP su liste lunghe
  - [ ] Test con liste estese (tenant, etc.)
  - [ ] Implementare paginazione se necessario

### Fase 4 - Sistema di Prompting Intelligente + lettura swagger
- [ ] Aggiunta prompt per creazione segmento semplice
- [ ] Aggiunta prompt per creazione segmento eventi
- [ ] Aggiunta prompt per creazione segmento combinato (contatti + eventi)
- [ ] Aggiunta prompt dinamici

### Fase 4.5 - Miglioramenti UX
- [ ] Text box chat con supporto wrap automatico
- [ ] Modifica titolo chat con doppio click (rimuovere bottone)

### Fase 5 - Testing Strategy
- [ ] Setup Jest per test unitari backend
- [ ] Setup Playwright per test E2E
- [ ] Test coverage per servizi core
- [ ] Test automatizzati CI/CD
- [ ] Performance testing

### Fase 6 - Markdown Rendering Fix ✅
- [] Correggere il rendering del markdown nei messaggi
- [] Testare il rendering di elementi complessi (code blocks, tabelle, liste)
- [] Verificare la compatibilità con diversi tipi di contenuto AI

### Fase 7 - Multi-LLM
- [ ] Architettura modulare LLM
- [ ] Implementazione provider multipli
- [ ] UI per selezione LLM
- [ ] Configurazione dinamica

### Fase 8 - Autenticazione Oauth
- [] Autenticazione Oauth per accesso alla chat
- [] Set apikey Gemini alla creazione dell'utente
- [] UI configurazione mcp server + oauth

## 🎨 Chat Sidebar - Specifiche Tecniche

### Componenti Frontend
```
frontend/src/components/
├── sidebar/
│   ├── Sidebar.tsx         # Componente principale
│   ├── ChatList.tsx        # Lista chat
│   ├── ChatItem.tsx        # Singolo elemento chat
│   ├── NewChatButton.tsx   # Pulsante nuova chat
│   └── DeleteChatModal.tsx # Modal conferma eliminazione
```

### API Endpoints
- `GET /api/chats` - Lista chat con metadati
- `DELETE /api/chats/:id` - Elimina chat
- `PUT /api/chats/:id` - Aggiorna titolo chat

### Funzionalità Base
- **Lista Chat**: Visualizzazione titolo, ultimo messaggio, data
- **Navigazione**: Click per aprire chat esistente
- **Nuova Chat**: Pulsante per creare chat
- **Eliminazione**: Modal di conferma per delete
- **Chat Attiva**: Highlight della chat corrente
- **Responsive**: Collassabile su mobile

### Design Requirements
- **Desktop**: Sidebar fissa 300px
- **Mobile**: Drawer overlay
- **Stati**: Loading, empty, error
- **Accessibilità**: Keyboard navigation

## 🧪 Testing Strategy - Specifiche Tecniche

### Test Unitari (Backend)
```
backend/src/
├── __tests__/
│   ├── services/
│   │   ├── geminiService.test.ts
│   │   ├── databaseService.test.ts
│   │   └── chatController.test.ts
│   ├── utils/
│   └── integration/
```

### Test E2E (Frontend)
```
frontend/
├── tests/
│   ├── e2e/
│   │   ├── chat-flow.spec.ts
│   │   ├── sidebar-navigation.spec.ts
│   │   └── responsive.spec.ts
│   └── fixtures/
```

### Strumenti Testing
- **Jest**: Test unitari e integrazione
- **Playwright**: Test E2E browser
- **Supertest**: API testing
- **MSW**: Mock service worker
- **Coverage**: Istanbul/nyc

### Coverage Requirements
- **Backend**: >80% coverage
- **Frontend**: >70% coverage
- **E2E**: 100% user journeys
- **Performance**: <2s load time

### **CI/CD Testing Pipeline**
- **Pre-commit**: Lint + unit tests
- **PR**: Full test suite + coverage
- **Deploy**: E2E tests + performance
- **Monitoring**: Test results dashboard

---

## 📚 Documentazione Correlata

- [Documentation Overview](./docs/README.md) - Panoramica della documentazione
- [Architecture Diagrams](./docs/architecture/diagrams.md) - Diagrammi di architettura del sistema
- [Development Process](./AGENTS.md) - Processo di sviluppo e workflow
- [Setup Guide](./README.md) - Guida all'installazione e configurazione
- [Gemini Integration](./docs/integrations/gemini-api.md) - Dettagli integrazione Gemini
- [Chat Sidebar](./docs/features/sidebar.md) - Funzionalità sidebar
- [Markdown Support](./docs/features/markdown-support.md) - Supporto rendering messaggi

---

**Nota**: Durante lo sviluppo, la documentazione sarà concisa e focalizzata sui concetti essenziali, evitando verbosità eccessiva.
