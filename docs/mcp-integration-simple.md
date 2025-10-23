# MCP Integration - Implementazione Semplificata

## 📋 Panoramica

Questa implementazione fornisce un'integrazione MCP (Model Context Protocol) semplificata per un singolo server MCP. L'LLM comunica direttamente con il server MCP usando il protocollo JSON-RPC 2.0.

## 🏗️ Architettura

```
User Message → ChatController → LLM with MCP Context → Tool Decision
                                                          ↓
Tool Call → MCPClient → JSON-RPC 2.0 → MCP Server → Plan API
                                                          ↓
Response ← MCPClient ← JSON-RPC Response ← MCP Server ← Plan API
     ↓
LLM interprets results → Final Response → User
```

## 🔧 Componenti

### 1. MCPConfig (`backend/src/config/mcpConfig.ts`)
Configurazione centralizzata per il server MCP:
- URL del server MCP
- Timeout e retry attempts
- System prompt per l'LLM
- Formato delle chiamate tool

### 2. MCPClient (`backend/src/services/mcpClient.ts`)
Client per comunicare con il server MCP:
- Chiamate tool via JSON-RPC 2.0
- Health check del server
- Inizializzazione connessione
- Gestione errori e timeout

### 3. MCPContextService (`backend/src/services/mcpContextService.ts`)
Servizio per fornire context MCP all'LLM:
- Ottiene lista tool disponibili
- Genera context per l'LLM
- Status del server MCP

### 4. ChatController (aggiornato)
Integrazione MCP nel controller chat:
- Routing intelligente LLM → MCP
- Estrazione tool calls dalle risposte LLM
- Esecuzione tool e interpretazione risultati
- Fallback a Gemini se MCP fallisce

### 5. HealthController (`backend/src/controllers/healthController.ts`)
Monitoring e health check:
- Status di tutti i servizi
- Health check dettagliato MCP
- Test connessione MCP

## ⚙️ Configurazione

### Environment Variables
```env
# MCP Configuration
MCP_ENABLED=true
MCP_SERVER_URL=http://localhost:8080
MCP_TIMEOUT=10000
MCP_RETRY_ATTEMPTS=3
```

### Configurazione MCP
```typescript
export const MCP_CONFIG: MCPConfig = {
  enabled: process.env.MCP_ENABLED === 'true',
  baseUrl: process.env.MCP_SERVER_URL || 'http://localhost:8080',
  timeout: parseInt(process.env.MCP_TIMEOUT || '10000'),
  retryAttempts: parseInt(process.env.MCP_RETRY_ATTEMPTS || '3'),
  systemPrompt: `...`,
  toolCallFormat: 'TOOL_CALL:toolName:{"param1":"value1","param2":"value2"}'
};
```

## 🚀 API Endpoints

### Health Check
- `GET /api/health` - Health check generale
- `GET /api/health/detailed` - Health check dettagliato
- `GET /api/health/mcp` - Status MCP specifico
- `GET /api/test/mcp` - Test connessione MCP
- `GET /api/mcp/status` - Status MCP dal chat controller

### Chat (esistenti, ora con MCP)
- `POST /api/chats/:chatId/messages` - Invia messaggio (ora con integrazione MCP)

## 🔄 Flusso di Funzionamento

### 1. Inizializzazione
```typescript
// ChatController constructor
if (this.mcpEnabled) {
  this.mcpClient = new MCPClient(MCP_CONFIG);
  this.mcpContextService = new MCPContextService(this.mcpClient, MCP_CONFIG);
  this.initializeMCP();
}
```

### 2. Processamento Messaggio
```typescript
// 1. Ottieni context MCP
const mcpContext = await this.mcpContextService.getMCPToolsContext();

// 2. Prompt LLM con context MCP
const systemPrompt = `${mcpContext}...`;

// 3. LLM decide se usare tool
const llmResponse = await geminiService.sendMessage([...chatHistory, systemPrompt]);

// 4. Estrai tool calls se presenti
const toolCalls = this.extractToolCalls(llmResponse.content);

// 5. Esegui tool calls e interpreta risultati
if (toolCalls.length > 0) {
  return await this.executeToolCallsAndRespond(toolCalls, message, chatHistory);
}
```

### 3. Tool Call Format
L'LLM risponde con:
```
TOOL_CALL:getAllPlanSegmentsByTenantId:{"tenant":12992}
```

### 4. Esecuzione Tool
```typescript
// 1. Chiama tool MCP
const result = await this.mcpClient.callTool(toolName, arguments);

// 2. Usa LLM per interpretare risultati
const prompt = `User asked: "${message}"\n\nTool results: ${result}`;
return await geminiService.sendMessage([...chatHistory, prompt]);
```

## 📝 Esempi di Utilizzo

### Esempio 1: Lista Segmenti
**User**: "Mostrami tutti i segmenti per il tenant 12992"
- **LLM Decision**: Rileva bisogno di `getAllPlanSegmentsByTenantId`
- **Tool Call**: `TOOL_CALL:getAllPlanSegmentsByTenantId:{"tenant":12992}`
- **MCP Response**: JSON con tutti i segmenti
- **LLM Response**: "Ecco tutti i segmenti per il tenant 12992: [lista formattata]"

### Esempio 2: Creazione Segmento
**User**: "Crea un nuovo segmento chiamato 'Marketing Campaign'"
- **LLM Decision**: Rileva bisogno di `createPlanSegmentsForTenant`
- **Tool Call**: `TOOL_CALL:createPlanSegmentsForTenant:{"tenant":12992,"body":"{\"name\":\"Marketing Campaign\"}"}`
- **MCP Response**: Conferma creazione
- **LLM Response**: "Ho creato con successo il segmento 'Marketing Campaign'"

### Esempio 3: Chat Generale
**User**: "Come stai oggi?"
- **LLM Decision**: Nessun tool MCP necessario
- **Direct Response**: "Sto bene, grazie! Come posso aiutarti?"

## 🛡️ Gestione Errori

### Fallback Strategy
1. **MCP Non Disponibile**: Torna a Gemini normale
2. **Tool Call Fallito**: Mostra errore e suggerisce alternative
3. **Server MCP Down**: Disabilita MCP e continua con Gemini

### Health Monitoring
```typescript
// Check MCP health
const isHealthy = await mcpClient.healthCheck();

// Get detailed status
const status = await mcpContextService.getMCPStatus();
// Returns: { healthy, initialized, toolsCount, serverInfo }
```

## 🔍 Debugging

### Logs
- `🔧 Calling MCP tool: toolName` - Tool call in corso
- `✅ MCP Server initialized successfully` - Inizializzazione OK
- `❌ MCP tool call failed` - Errore tool call
- `⚠️ MCP Server is not healthy` - Server non raggiungibile

### Health Check Endpoints
```bash
# Check overall health
curl http://localhost:3001/api/health

# Check MCP specifically
curl http://localhost:3001/api/health/mcp

# Test MCP connection
curl http://localhost:3001/api/test/mcp
```

## 🚀 Deployment

### 1. Environment Setup
```bash
# Copy environment file
cp backend/env.example backend/.env

# Edit .env with your MCP server URL
MCP_ENABLED=true
MCP_SERVER_URL=http://your-mcp-server:8080
```

### 2. Start Services
```bash
# Start MCP Server (Java)
cd plan-segment-assistant
./mvnw spring-boot:run

# Start AI Agent Chat (Node.js)
cd backend
npm run dev
```

### 3. Verify Integration
```bash
# Check health
curl http://localhost:3001/api/health

# Test chat with MCP
curl -X POST http://localhost:3001/api/chats/your-chat-id/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Mostrami tutti i segmenti"}'
```

## 🎯 Vantaggi

1. **🤖 LLM Decision Making**: L'LLM decide autonomamente quando usare i tool
2. **🔧 Tool Discovery**: L'LLM conosce tutti i tool disponibili dinamicamente
3. **📝 Natural Language**: L'utente può esprimersi in linguaggio naturale
4. **🔄 Multi-Tool**: L'LLM può chiamare più tool in sequenza
5. **⚡ Fallback**: Se MCP fallisce, torna a risposta diretta
6. **🎯 Context Aware**: L'LLM capisce il contesto e sceglie il tool giusto
7. **🛡️ Robust**: Gestione errori e monitoring completi

## 🔮 Estensioni Future

Questa implementazione è progettata per essere facilmente estendibile:

1. **Multi-MCP Support**: Aggiungere supporto per più server MCP
2. **Tool Caching**: Cache per risultati tool frequenti
3. **Advanced Routing**: Routing più sofisticato basato su context
4. **Metrics**: Metriche dettagliate per performance
5. **Tool Composition**: Combinazione di tool per task complessi

---

**Nota**: Questa implementazione è ottimizzata per un singolo server MCP. Per supporto multi-MCP, vedere la documentazione avanzata.
