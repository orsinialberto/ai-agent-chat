# MCP Integration - Fase 2
## Implementazione Client-Server MCP per AI Agent Chat

### 📋 Indice
1. [Panoramica Architettura](#panoramica-architettura)
2. [Protocollo JSON-RPC 2.0](#protocollo-json-rpc-20)
3. [Implementazione Backend](#implementazione-backend)
4. [Integrazione Chat Controller](#integrazione-chat-controller)
5. [Configurazione e Deployment](#configurazione-e-deployment)
6. [Testing Strategy](#testing-strategy)
7. [Troubleshooting](#troubleshooting)
8. [Performance e Monitoring](#performance-e-monitoring)

---

## 🏗️ Panoramica Architettura

### Diagramma di Comunicazione
```
┌─────────────────┐    HTTP/JSON-RPC 2.0    ┌─────────────────┐
│  AI Agent Chat  │ ────────────────────────▶ │  MCP Server     │
│  (Node.js)      │                          │  (Java/Spring)  │
│                 │ ◀──────────────────────── │                 │
└─────────────────┘                          └─────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                          ┌─────────────────┐
│   PostgreSQL    │                          │  Plan API       │
│   Database      │                          │  (External)     │
└─────────────────┘                          └─────────────────┘
```

### Flusso di Dati
1. **User Message** → Chat Controller
2. **Message Analysis** → Determina se usare MCP tools
3. **MCP Tool Call** → JSON-RPC 2.0 request al MCP Server
4. **MCP Server** → Chiama Plan API esterna
5. **Response** → MCP Server → AI Agent Chat → User

---

## 📡 Protocollo JSON-RPC 2.0

### Struttura Richiesta
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "toolName",
    "arguments": {
      "param1": "value1",
      "param2": 123
    }
  }
}
```

### Struttura Risposta
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"data\": [...]}"
      }
    ],
    "isError": false
  }
}
```

### Gestione Errori
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Tool execution failed: ..."
  }
}
```

---

## 🔧 Implementazione Backend

### 1. MCPClient Service

```typescript
// backend/src/services/mcpClient.ts
import fetch from 'node-fetch';

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content: Array<{
      type: string;
      text: string;
    }>;
    isError: boolean;
  };
  error?: {
    code: number;
    message: string;
  };
}

export class MCPClient {
  private baseUrl: string;
  private requestId: number = 0;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.MCP_SERVER_URL || 'http://localhost:8080';
    this.timeout = parseInt(process.env.MCP_TIMEOUT || '10000');
  }

  /**
   * Chiama un tool MCP specifico
   */
  async callTool(toolName: string, arguments: Record<string, any>): Promise<string> {
    const requestId = ++this.requestId;
    
    const requestBody = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments
      }
    };

    try {
      console.log(`🔧 Calling MCP tool: ${toolName}`, arguments);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MCPResponse = await response.json() as MCPResponse;
      
      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message}`);
      }

      if (!data.result || !data.result.content || data.result.content.length === 0) {
        throw new Error('Invalid MCP response structure');
      }

      return data.result.content[0].text;
    } catch (error) {
      console.error(`❌ MCP tool call failed: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * Ottiene la lista dei tool disponibili
   */
  async getAvailableTools(): Promise<any[]> {
    const requestBody = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/list',
      params: {}
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        timeout: this.timeout
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message}`);
      }

      return data.result?.tools || [];
    } catch (error) {
      console.error('❌ Failed to get available tools', error);
      throw error;
    }
  }

  /**
   * Inizializza la connessione MCP
   */
  async initialize(): Promise<boolean> {
    const requestBody = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'initialize',
      params: {}
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        timeout: this.timeout
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message}`);
      }

      console.log('✅ MCP Server initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize MCP server', error);
      return false;
    }
  }

  /**
   * Verifica lo stato del server MCP
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/actuator/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ MCP Server health check failed', error);
      return false;
    }
  }
}
```

### 2. MCP Tool Wrapper

```typescript
// backend/src/services/mcpTools.ts
import { MCPClient } from './mcpClient';

export class MCPTools {
  private mcpClient: MCPClient;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  /**
   * Ottiene tutti i tenant disponibili
   */
  async getAllTenants(): Promise<string> {
    return this.mcpClient.callTool('getAllTenants', {});
  }

  /**
   * Ottiene tutti i segmenti di piano per un tenant
   */
  async getPlanSegments(tenant: number, style: string = 'compact'): Promise<string> {
    return this.mcpClient.callTool('getAllPlanSegmentsByTenantIdAndStyle', {
      tenant,
      style
    });
  }

  /**
   * Ottiene un segmento specifico
   */
  async getPlanSegment(tenant: number, segmentId: string): Promise<string> {
    return this.mcpClient.callTool('getPlanSegmentByTenantIdAndSegmentId', {
      tenant,
      segmentId
    });
  }

  /**
   * Crea un nuovo segmento
   */
  async createPlanSegment(tenant: number, segmentData: string): Promise<string> {
    return this.mcpClient.callTool('createPlanSegmentsForTenant', {
      tenant,
      body: segmentData
    });
  }

  /**
   * Ottiene metadata dei contatti
   */
  async getContactMetadata(tenant: number): Promise<string> {
    return this.mcpClient.callTool('getAllContactsMetadata', {
      tenant
    });
  }

  /**
   * Ottiene valori di attributo contatto
   */
  async getContactAttributeValues(tenant: number, attribute: string): Promise<string> {
    return this.mcpClient.callTool('getContactAttributeValues', {
      tenant,
      attribute
    });
  }

  /**
   * Ottiene categorie e tipi di eventi
   */
  async getEventCategories(tenant: number): Promise<string> {
    return this.mcpClient.callTool('getEventCategoriesAndTypes', {
      tenant
    });
  }

  /**
   * Ottiene metadata degli eventi
   */
  async getEventMetadata(tenant: number, category: string, type: string): Promise<string> {
    return this.mcpClient.callTool('getEventsMetadataByCategoryAndType', {
      tenant,
      category,
      type
    });
  }

  /**
   * Ottiene tutte le statement
   */
  async getStatements(tenant: number): Promise<string> {
    return this.mcpClient.callTool('getStatements', {
      tenant
    });
  }

  /**
   * Crea una nuova statement
   */
  async createStatement(tenant: number, statementData: string): Promise<string> {
    return this.mcpClient.callTool('createStatement', {
      tenant,
      request: statementData
    });
  }
}
```

---

## 🎮 Integrazione Chat Controller

### 1. Estensione ChatController

```typescript
// backend/src/controllers/chatController.ts
import { MCPClient } from '../services/mcpClient';
import { MCPTools } from '../services/mcpTools';

export class ChatController {
  private geminiService: GeminiService;
  private mcpClient: MCPClient;
  private mcpTools: MCPTools;
  private mcpEnabled: boolean;

  constructor() {
    this.geminiService = new GeminiService();
    this.mcpClient = new MCPClient();
    this.mcpTools = new MCPTools(this.mcpClient);
    this.mcpEnabled = process.env.MCP_ENABLED === 'true';
    
    // Inizializza MCP se abilitato
    if (this.mcpEnabled) {
      this.initializeMCP();
    }
  }

  private async initializeMCP(): Promise<void> {
    try {
      const isHealthy = await this.mcpClient.healthCheck();
      if (!isHealthy) {
        console.warn('⚠️ MCP Server is not healthy, disabling MCP features');
        this.mcpEnabled = false;
        return;
      }

      const initialized = await this.mcpClient.initialize();
      if (!initialized) {
        console.warn('⚠️ Failed to initialize MCP Server, disabling MCP features');
        this.mcpEnabled = false;
        return;
      }

      console.log('✅ MCP Server initialized successfully');
    } catch (error) {
      console.error('❌ MCP initialization failed:', error);
      this.mcpEnabled = false;
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, chatId } = req.body;
      const userId = req.user?.id;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      // Salva il messaggio dell'utente
      const userMessage = await this.saveMessage(chatId, 'user', message, userId);

      // Determina se usare MCP tools
      let response: string;
      
      if (this.mcpEnabled && this.shouldUseMCPTools(message)) {
        response = await this.processWithMCPTools(message);
      } else {
        response = await this.processWithGemini(message, chatId);
      }

      // Salva la risposta dell'assistente
      await this.saveMessage(chatId, 'assistant', response, userId);

      res.json({ 
        message: response,
        chatId: chatId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Determina se il messaggio richiede l'uso di tool MCP
   */
  private shouldUseMCPTools(message: string): boolean {
    const mcpKeywords = [
      'segmento', 'segment', 'contatto', 'contact', 
      'evento', 'event', 'tenant', 'statement', 
      'widget', 'metadata', 'attributo', 'attribute'
    ];

    const lowerMessage = message.toLowerCase();
    return mcpKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Processa il messaggio usando i tool MCP
   */
  private async processWithMCPTools(message: string): Promise<string> {
    try {
      console.log('🔧 Processing message with MCP tools');

      // Analizza il messaggio per determinare quale tool usare
      const toolResult = await this.analyzeAndCallMCPTool(message);
      
      if (toolResult) {
        // Usa Gemini per interpretare i risultati MCP
        const context = `Dati ottenuti dai tool MCP: ${toolResult}`;
        const prompt = `Analizza questi dati e rispondi alla domanda dell'utente: "${message}"\n\nDati: ${context}`;
        
        return await this.geminiService.generateResponse(prompt);
      } else {
        // Fallback a Gemini normale
        return await this.geminiService.generateResponse(message);
      }
    } catch (error) {
      console.error('❌ MCP tool processing failed, falling back to Gemini:', error);
      return await this.geminiService.generateResponse(message);
    }
  }

  /**
   * Analizza il messaggio e chiama il tool MCP appropriato
   */
  private async analyzeAndCallMCPTool(message: string): Promise<string | null> {
    const lowerMessage = message.toLowerCase();

    try {
      // Tool per ottenere tenant
      if (lowerMessage.includes('tenant') || lowerMessage.includes('tenants')) {
        return await this.mcpTools.getAllTenants();
      }

      // Tool per ottenere segmenti
      if (lowerMessage.includes('segmento') || lowerMessage.includes('segment')) {
        const tenant = this.extractTenantFromMessage(message) || 12992;
        
        if (lowerMessage.includes('crea') || lowerMessage.includes('create')) {
          const segmentData = this.extractSegmentDataFromMessage(message);
          return await this.mcpTools.createPlanSegment(tenant, segmentData);
        } else if (lowerMessage.includes('tutti') || lowerMessage.includes('all')) {
          return await this.mcpTools.getPlanSegments(tenant);
        } else {
          // Prova a estrarre un ID segmento specifico
          const segmentId = this.extractSegmentIdFromMessage(message);
          if (segmentId) {
            return await this.mcpTools.getPlanSegment(tenant, segmentId);
          } else {
            return await this.mcpTools.getPlanSegments(tenant);
          }
        }
      }

      // Tool per ottenere contatti
      if (lowerMessage.includes('contatto') || lowerMessage.includes('contact')) {
        const tenant = this.extractTenantFromMessage(message) || 12992;
        
        if (lowerMessage.includes('metadata')) {
          return await this.mcpTools.getContactMetadata(tenant);
        } else if (lowerMessage.includes('attributo') || lowerMessage.includes('attribute')) {
          const attribute = this.extractAttributeFromMessage(message);
          if (attribute) {
            return await this.mcpTools.getContactAttributeValues(tenant, attribute);
          }
        }
      }

      // Tool per ottenere eventi
      if (lowerMessage.includes('evento') || lowerMessage.includes('event')) {
        const tenant = this.extractTenantFromMessage(message) || 12992;
        
        if (lowerMessage.includes('categoria') || lowerMessage.includes('category')) {
          return await this.mcpTools.getEventCategories(tenant);
        } else {
          // Prova a estrarre categoria e tipo
          const category = this.extractCategoryFromMessage(message);
          const type = this.extractTypeFromMessage(message);
          
          if (category && type) {
            return await this.mcpTools.getEventMetadata(tenant, category, type);
          }
        }
      }

      // Tool per statement
      if (lowerMessage.includes('statement') || lowerMessage.includes('query')) {
        const tenant = this.extractTenantFromMessage(message) || 12992;
        
        if (lowerMessage.includes('crea') || lowerMessage.includes('create')) {
          const statementData = this.extractStatementDataFromMessage(message);
          return await this.mcpTools.createStatement(tenant, statementData);
        } else {
          return await this.mcpTools.getStatements(tenant);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error calling MCP tool:', error);
      return null;
    }
  }

  /**
   * Metodi di estrazione dati dal messaggio
   */
  private extractTenantFromMessage(message: string): number | null {
    const tenantMatch = message.match(/tenant[:\s]*(\d+)/i);
    return tenantMatch ? parseInt(tenantMatch[1]) : null;
  }

  private extractSegmentIdFromMessage(message: string): string | null {
    const segmentIdMatch = message.match(/segment[o\s]*id[:\s]*([a-zA-Z0-9-_]+)/i);
    return segmentIdMatch ? segmentIdMatch[1] : null;
  }

  private extractAttributeFromMessage(message: string): string | null {
    const attributeMatch = message.match(/attributo[:\s]*([a-zA-Z0-9-_]+)/i);
    return attributeMatch ? attributeMatch[1] : null;
  }

  private extractCategoryFromMessage(message: string): string | null {
    const categoryMatch = message.match(/categoria[:\s]*([a-zA-Z0-9-_]+)/i);
    return categoryMatch ? categoryMatch[1] : null;
  }

  private extractTypeFromMessage(message: string): string | null {
    const typeMatch = message.match(/tipo[:\s]*([a-zA-Z0-9-_]+)/i);
    return typeMatch ? typeMatch[1] : null;
  }

  private extractSegmentDataFromMessage(message: string): string {
    // Estrae i dati del segmento dal messaggio
    // Implementazione semplificata - in produzione sarebbe più sofisticata
    return JSON.stringify({
      name: "Segment from message",
      description: message
    });
  }

  private extractStatementDataFromMessage(message: string): string {
    // Estrae i dati della statement dal messaggio
    return JSON.stringify({
      query: "SELECT * FROM test_table",
      description: message
    });
  }
}
```

---

## ⚙️ Configurazione e Deployment

### 1. Environment Variables

```env
# .env
# MCP Configuration
MCP_ENABLED=true
MCP_SERVER_URL=http://localhost:8080
MCP_TIMEOUT=10000
MCP_RETRY_ATTEMPTS=3

# Existing configuration
DATABASE_URL="postgresql://user:password@localhost:5432/ai_agent_chat"
GEMINI_API_KEY="your_gemini_api_key"
JWT_SECRET="your_jwt_secret"
```

### 2. Health Check Endpoint

```typescript
// backend/src/controllers/healthController.ts
import { Request, Response } from 'express';
import { MCPClient } from '../services/mcpClient';

export class HealthController {
  private mcpClient: MCPClient;

  constructor() {
    this.mcpClient = new MCPClient();
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: await this.checkDatabase(),
          mcp: await this.mcpClient.healthCheck(),
          gemini: await this.checkGemini()
        }
      };

      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // Implementa check database
      return true;
    } catch {
      return false;
    }
  }

  private async checkGemini(): Promise<boolean> {
    try {
      // Implementa check Gemini API
      return true;
    } catch {
      return false;
    }
  }
}
```

### 3. Docker Configuration

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  ai-agent-chat:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - MCP_SERVER_URL=http://mcp-server:8080
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/ai_agent_chat
    depends_on:
      - postgres
      - mcp-server

  mcp-server:
    build: ./plan-segment-assistant
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_agent_chat
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

```typescript
// backend/src/__tests__/services/mcpClient.test.ts
import { MCPClient } from '../../services/mcpClient';
import fetch from 'node-fetch';

jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('MCPClient', () => {
  let mcpClient: MCPClient;

  beforeEach(() => {
    mcpClient = new MCPClient();
    jest.clearAllMocks();
  });

  describe('callTool', () => {
    it('should call MCP tool successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [{ type: 'text', text: '{"data": "test"}' }],
          isError: false
        }
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await mcpClient.callTool('testTool', { param: 'value' });

      expect(result).toBe('{"data": "test"}');
      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:8080',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should handle MCP errors', async () => {
      const mockError = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: 'Tool execution failed'
        }
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockError)
      } as any);

      await expect(mcpClient.callTool('testTool', {})).rejects.toThrow('MCP Error: Tool execution failed');
    });
  });

  describe('healthCheck', () => {
    it('should return true when server is healthy', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true
      } as any);

      const result = await mcpClient.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when server is unhealthy', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await mcpClient.healthCheck();

      expect(result).toBe(false);
    });
  });
});
```

### 2. Integration Tests

```typescript
// backend/src/__tests__/integration/mcpIntegration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { MCPClient } from '../../services/mcpClient';

jest.mock('../../services/mcpClient');

describe('MCP Integration', () => {
  let mockMCPClient: jest.Mocked<MCPClient>;

  beforeEach(() => {
    mockMCPClient = new MCPClient() as jest.Mocked<MCPClient>;
    mockMCPClient.callTool = jest.fn();
    mockMCPClient.healthCheck = jest.fn();
  });

  describe('POST /api/chat/send', () => {
    it('should use MCP tools when appropriate keywords are detected', async () => {
      mockMCPClient.callTool.mockResolvedValue('{"segments": []}');

      const response = await request(app)
        .post('/api/chat/send')
        .send({
          message: 'Mostrami tutti i segmenti per il tenant 12992',
          chatId: 'test-chat-id'
        })
        .expect(200);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith(
        'getAllPlanSegmentsByTenantId',
        { tenant: 12992 }
      );
      expect(response.body.message).toBeDefined();
    });

    it('should fallback to Gemini when MCP tools fail', async () => {
      mockMCPClient.callTool.mockRejectedValue(new Error('MCP tool failed'));

      const response = await request(app)
        .post('/api/chat/send')
        .send({
          message: 'Mostrami tutti i segmenti',
          chatId: 'test-chat-id'
        })
        .expect(200);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/health', () => {
    it('should include MCP health status', async () => {
      mockMCPClient.healthCheck.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.services.mcp).toBe(true);
    });
  });
});
```

### 3. E2E Tests

```typescript
// backend/src/__tests__/e2e/mcpE2E.test.ts
import { test, expect } from '@playwright/test';

test.describe('MCP Integration E2E', () => {
  test('should handle MCP tool calls end-to-end', async ({ page }) => {
    await page.goto('/');

    // Invia messaggio che richiede MCP tools
    await page.fill('[data-testid="message-input"]', 'Mostrami tutti i segmenti');
    await page.click('[data-testid="send-button"]');

    // Verifica che la risposta sia arrivata
    await expect(page.locator('[data-testid="message-list"]')).toContainText('segmenti');

    // Verifica che non ci siano errori
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });

  test('should show loading state during MCP calls', async ({ page }) => {
    await page.goto('/');

    await page.fill('[data-testid="message-input"]', 'Mostrami tutti i segmenti');
    await page.click('[data-testid="send-button"]');

    // Verifica che sia mostrato lo stato di caricamento
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();

    // Attendi che il caricamento finisca
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });
});
```

---

## 🔧 Troubleshooting

### 1. Problemi Comuni

#### MCP Server Non Raggiungibile
```bash
# Verifica che il server MCP sia in esecuzione
curl -X GET http://localhost:8080/actuator/health

# Controlla i log del server MCP
docker logs mcp-server-container
```

#### Errori di Connessione
```typescript
// Aggiungi retry logic nel MCPClient
private async callToolWithRetry(toolName: string, arguments: Record<string, any>, maxRetries: number = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.callTool(toolName, arguments);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`🔄 Retry attempt ${attempt} for tool ${toolName}`);
      await this.delay(1000 * attempt); // Exponential backoff
    }
  }
}
```

#### Timeout Issues
```typescript
// Configura timeout appropriati
const timeout = parseInt(process.env.MCP_TIMEOUT || '10000');

const response = await fetch(this.baseUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody),
  timeout: timeout,
  signal: AbortSignal.timeout(timeout)
});
```

### 2. Debug Tools

#### Logging Dettagliato
```typescript
// Abilita debug logging
const debugMode = process.env.MCP_DEBUG === 'true';

if (debugMode) {
  console.log('🔧 MCP Debug:', {
    toolName,
    arguments,
    requestBody,
    response: data
  });
}
```

#### Health Check Dettagliato
```typescript
// Health check con dettagli
async detailedHealthCheck(): Promise<any> {
  const health = {
    mcpServer: {
      url: this.baseUrl,
      reachable: false,
      initialized: false,
      tools: []
    }
  };

  try {
    health.mcpServer.reachable = await this.healthCheck();
    
    if (health.mcpServer.reachable) {
      health.mcpServer.initialized = await this.initialize();
      health.mcpServer.tools = await this.getAvailableTools();
    }
  } catch (error) {
    health.mcpServer.error = error.message;
  }

  return health;
}
```

### 3. Performance Optimization

#### Connection Pooling
```typescript
// Implementa connection pooling per HTTP
import { Agent } from 'https';

const agent = new Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 10000
});

const response = await fetch(this.baseUrl, {
  agent,
  // ... altre opzioni
});
```

#### Caching
```typescript
// Cache per tool results
private cache = new Map<string, { data: string; timestamp: number }>();
private cacheTimeout = 5 * 60 * 1000; // 5 minuti

private getCachedResult(key: string): string | null {
  const cached = this.cache.get(key);
  if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
    return cached.data;
  }
  return null;
}

private setCachedResult(key: string, data: string): void {
  this.cache.set(key, { data, timestamp: Date.now() });
}
```

---

## 📊 Performance e Monitoring

### 1. Metrics Collection

```typescript
// backend/src/services/metrics.ts
export class MetricsCollector {
  private mcpCallDuration: number[] = [];
  private mcpCallCount: number = 0;
  private mcpErrorCount: number = 0;

  recordMCPCall(duration: number, success: boolean): void {
    this.mcpCallDuration.push(duration);
    this.mcpCallCount++;
    
    if (!success) {
      this.mcpErrorCount++;
    }
  }

  getMetrics(): any {
    return {
      mcpCalls: {
        total: this.mcpCallCount,
        errors: this.mcpErrorCount,
        successRate: (this.mcpCallCount - this.mcpErrorCount) / this.mcpCallCount,
        averageDuration: this.mcpCallDuration.reduce((a, b) => a + b, 0) / this.mcpCallDuration.length
      }
    };
  }
}
```

### 2. Monitoring Dashboard

```typescript
// backend/src/controllers/metricsController.ts
export class MetricsController {
  private metricsCollector: MetricsCollector;

  constructor() {
    this.metricsCollector = new MetricsCollector();
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        ...this.metricsCollector.getMetrics(),
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

## 🎯 Conclusioni

L'integrazione MCP fornisce:

1. **✅ Comunicazione robusta** tra AI Agent Chat e MCP Server
2. **✅ Tool discovery dinamico** per funzionalità estese
3. **✅ Fallback graceful** quando MCP non è disponibile
4. **✅ Monitoring completo** per performance e debugging
5. **✅ Testing strategy** completa per qualità del codice

### Prossimi Passi

1. **Implementa il MCPClient** nel backend
2. **Integra con ChatController** per routing intelligente
3. **Configura environment** per deployment
4. **Esegui test completi** per validazione
5. **Monitora performance** in produzione

---

**Nota**: Questo documento sarà aggiornato man mano che l'implementazione procede e vengono identificati nuovi requisiti o ottimizzazioni.
