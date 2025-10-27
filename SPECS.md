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

### Settimana 1-2: Setup Base
- [x] Configurazione ambiente di sviluppo
- [x] Setup database PostgreSQL + Prisma
- [x] Struttura base backend Express
- [x] Struttura base frontend React

### Settimana 3-4: Fase 1 - Gemini
- [x] Integrazione Gemini API
- [x] Implementazione chat persistente
- [x] Interfaccia utente base
- [x] Test end-to-end

### Settimana 5: Fase 1.5 - Chat Sidebar ✅
- [x] Sidebar component con lista chat
- [x] Navigazione tra chat esistenti
- [x] Gestione chat (crea/elimina)
- [x] Design responsive
- [x] Test integrazione sidebar

### Settimana 6-7: Fase 2 - MCP
- [x] Implementazione MCP client
- [x] Estensione agent con tools
- [x] Gestione dinamica funzionalità
- [x] Testing MCP integration

### Settimana 7.2: MCP Tool Call Parser Fix ✅
- [x] Fix parsing tool calls con JSON annidati (brace counting)
- [x] Gestione strutture JSON complesse in tool call arguments
- [ ] Migrazione a @modelcontextprotocol/sdk per parsing robusto
- [ ] Implementazione gestione errori migliorata
- [ ] Test con strutture JSON deep

### Settimana 7.5: Sistema di Prompting Intelligente + lettura swagger
 - [] Aggiunta prompt per creazione segmento semplice
 - [] Aggiunta prompt per creazione segmento combinato
 - [] Aggiunta prompt dinamici

### Settimana 7-8: Testing Strategy
- [ ] Setup Jest per test unitari backend
- [ ] Setup Playwright per test E2E
- [ ] Test coverage per servizi core
- [ ] Test automatizzati CI/CD
- [ ] Performance testing

### Settimana 5.6: Markdown Rendering Fix ✅
- [x] Correggere il rendering del markdown nei messaggi
- [x] Implementare una libreria dedicata per il rendering markdown
- [x] Testare il rendering di elementi complessi (code blocks, tabelle, liste)
- [x] Verificare la compatibilità con diversi tipi di contenuto AI

**Implementazione completata:**
- ✅ Sostituito parser regex personalizzato con `react-markdown`
- ✅ Aggiunto supporto GitHub Flavored Markdown con `remark-gfm`
- ✅ Implementato syntax highlighting con `react-syntax-highlighter`
- ✅ Aggiunta sanitizzazione HTML automatica con `rehype-sanitize`
- ✅ Supporto completo per tabelle, code blocks, liste, link, formattazione
- ✅ CSS aggiornato con stili inline per compatibilità
- ✅ Test suite completa per il nuovo componente
- ✅ Risolti problemi CORS e rate limiting del backend

### Settimana 8-9: Fase 3 - Multi-LLM
- [ ] Architettura modulare LLM
- [ ] Implementazione provider multipli
- [ ] UI per selezione LLM
- [ ] Configurazione dinamica

### Settimana 9-10: Fase 4 - Autenticazione Oauth
 - [] Autenticazione Oauth per accesso alla chat
 - [] Set apikey Gemini alla creazione dell'utente
 - [] UI configurazione mcp server + oauth

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

## 🎨 Chat Sidebar - Specifiche Tecniche

### Componenti Frontend
```
frontend/src/components/
├── sidebar/
│   ├── Sidebar.tsx           # Componente principale
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

## 🔍 Considerazioni Aggiuntive

### **MCP Server Integration**
Per la Fase 2, considera:
- **Stdio vs HTTP**: Stdio è più performante per processi locali, HTTP per server remoti
- **Gestione connessioni**: Implementa connection pooling e retry logic
- **Tool discovery**: Cache dinamica dei tools disponibili

### **Chat Sidebar Integration**
Per la gestione delle chat:
- **Performance**: Lazy loading per molte chat
- **UX**: Transizioni fluide tra chat
- **State Management**: Sincronizzazione sidebar-chat
- **Mobile First**: Design responsive prioritario

### **Testing Strategy Integration**
Per la qualità del codice:
- **Test-Driven Development**: Scrivere test prima del codice
- **Continuous Testing**: Test automatici ad ogni commit
- **Quality Gates**: Coverage minimo per deploy
- **Performance Monitoring**: Test di carico e latenza

### **Multi-LLM Strategy**
- **Cost optimization**: Routing intelligente basato su costo/performance
- **A/B testing**: Possibilità di testare diversi LLM per la stessa query
- **Load balancing**: Distribuzione del carico tra provider

### **Markdown Rendering Issues**
Il rendering del markdown nei messaggi AI presenta problemi significativi:
- **Code blocks**: Non vengono formattati correttamente
- **Syntax highlighting**: Mancante per blocchi di codice
- **Tabelle**: Rendering inconsistente o mancante
- **Liste annidate**: Struttura non preservata
- **Link**: Non vengono renderizzati come clickabili
- **Formattazione**: Bold, italic, strikethrough non funzionano correttamente

**Soluzione proposta**: Implementare una libreria dedicata come `react-markdown` con `remark-gfm` per supporto GitHub Flavored Markdown e `react-syntax-highlighter` per syntax highlighting dei code blocks.

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
