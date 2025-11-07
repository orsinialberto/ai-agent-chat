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
│   ├── config/              # Configuration files
│   │   ├── mcp-config.yml   # MCP configuration (optional)
│   │   └── mcp-config.yml.example  # MCP config template
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

# MCP Server (Fase 2) - Opzionale
# MCP è configurato tramite backend/config/mcp-config.yml
# Se il file non esiste, MCP è disabilitato
# Vedi backend/config/mcp-config.yml.example per il template

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
    "@google/generative-ai": "^0.1.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9"
  }
}
```

## 🚀 Roadmap di Sviluppo

### Fase 3 - MCP Tool Call Parser Fix ✅
- [x] Fix parsing tool calls con JSON annidati (brace counting)
- [x] Gestione strutture JSON complesse in tool call arguments
- [x] Implementazione gestione errori migliorata con auto-correzione LLM

### Fase 3.5 - Ottimizzazioni e Fix Tecnici
- [x] Fix errori build backend (npm run build)
- [x] Fix errori build frontend (npm run build)
- [x] Slegare prompt MCP dal backend ✅
  - [x] Valutare approccio: esterno vs server MCP endpoint
  - [x] Implementare caricamento dinamico prompt
  - [x] Definire best practice architetturale
  - [x] Creare file YAML configurazione completa (mcp-config.yml)
  - [x] Rendere configurazione MCP opzionale
- [x] Cleanup log e debug MCP
  - [x] Rimuovere/movare a debug i log verbose
  - [x] Mantenere solo log essenziali

### Fase 4 - Sistema di Prompting Intelligente + lettura swagger
- [x] Aggiunta prompt per creazione segmento semplice
- [x] Aggiunta prompt per creazione segmento eventi
- [x] Aggiunta prompt per creazione segmento combinato (contatti + eventi)
- [ ] Aggiunta prompt per compleanno contatto

### Fase 7 - Multi-LLM
- [x] UI selezione modello Gemini (dropdown minimal in `ChatInterface`)
- [x] Propagazione modello al backend tramite campo `model` opzionale
- [x] Backend: `geminiService.switchModel(model)` e validazione modelli
- [x] Testing: unit + E2E con skip condizionale se `GEMINI_API_KEY` assente
- [ ] Architettura modulare provider (plugin) e multi-LLM completa


### Fase 10 - Autenticazione ✅
- [x] Sistema di autenticazione completo con JWT
- [x] Registrazione e login utenti
- [x] OAuth token per MCP (opzionale, solo se MCP abilitato)
- [x] Protezione endpoint con middleware
- [x] Frontend con routing protetto (React Router)
- [x] MockServer per OAuth mock (Docker)

**Dettagli implementazione:**
- **Database**: Tabella `users` con username, email, password (bcrypt hash), oauthToken opzionale
- **Backend**: AuthService, AuthController, authenticate middleware
- **Frontend**: AuthContext, LoginPage, RegisterPage, ProtectedRoute
- **Token Flow**: 
  - JWT per frontend ↔ backend (sempre)
  - OAuth token per backend ↔ MCP server (solo se MCP abilitato)
- **Sicurezza**: Password hash con bcrypt, JWT con scadenza, logout automatico su token scaduto
- **Configurazione**: oauth-config.yml opzionale, MockServer Docker commentato di default
- **Documentazione completa**: `docs/features/authentication.md`

### Fase 11 - Grafici ✅
- [x] Mostrare grafici in interfaccia
- [x] Modificare prompt per migliorare visualizzazione dati (gli elenchi puntati non sempre sono la scelta migliore)

**Implementation Details:**
- **Library**: Recharts for chart rendering
- **Supported chart types**: Line, Bar, Pie, Area
- **Syntax**: Markdown code blocks with `chart:TYPE` language identifier
- **Features**: Multiple series, custom colors, responsive design, error handling
- **Components**: `ChartRenderer.tsx` + `MarkdownRenderer.tsx` integration
- **Backend**: System instruction in `geminiService.ts` teaches LLM chart syntax
- **Tests**: Full test coverage for all chart types and error scenarios
- **Documentation**: Complete user and developer documentation in `docs/features/chart-visualization.md`

#### Dettagli Implementativi
- Frontend
  - Componente: `frontend/src/components/ChatInterface.tsx`
  - Dropdown posizionato in basso a sinistra della text area, stile minimal senza bordi
  - Opzioni predefinite: `gemini-2.5-flash`, `gemini-2.5-pro`
  - Il modello selezionato viene inviato sia in creazione chat sia in invio messaggio

- API Frontend
  - `CreateChatRequest`: `{ title?: string; initialMessage?: string; model?: string }`
  - `CreateMessageRequest`: `{ chatId: string; content: string; role?: 'user'|'system'; model?: string }`

- Backend
  - Tipi condivisi aggiornati: `backend/src/types/shared.ts` include `model?: string` nelle request
  - Controller: `backend/src/controllers/chatController.ts`
    - Se presente `model`, viene invocato `geminiService.switchModel(model)` con validazione
    - In caso di errore LLM durante creazione/invio, risposta `503` con `errorType: 'LLM_UNAVAILABLE'` e `chatId` quando applicabile
  - Servizio Gemini: `backend/src/services/geminiService.ts`
    - Modelli disponibili: `getAvailableModels() => ['gemini-2.5-flash','gemini-2.5-pro']`
    - `switchModel(modelName: string)` per cambiare modello runtime

- Testing
  - Unit e integrazione aggiornati per i nuovi percorsi di errore
  - E2E: skip del test "send message" se `GEMINI_API_KEY` non è settata per evitare timeout locali

#### Note UX
- Hover del selettore alleggerito (grigio molto trasparente), focus con sfondo bianco
- Allineamento a sinistra coerente con il padding della text area

### Fase 8 - Autenticazione Oauth ✅
- [x] Autenticazione JWT per accesso alla chat
- [x] OAuth token per server MCP (opzionale)

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
