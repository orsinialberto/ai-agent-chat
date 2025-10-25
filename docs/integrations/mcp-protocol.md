# MCP Integration - Phase 2
## MCP Client-Server Implementation for AI Agent Chat

### 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [JSON-RPC 2.0 Protocol](#json-rpc-20-protocol)
3. [Backend Implementation](#backend-implementation)
4. [Chat Controller Integration](#chat-controller-integration)
5. [Configuration and Deployment](#configuration-and-deployment)
6. [Testing Strategy](#testing-strategy)
7. [Troubleshooting](#troubleshooting)
8. [Performance and Monitoring](#performance-and-monitoring)

---

## 🏗️ Architecture Overview

### Communication Diagram
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

### Data Flow
1. **User Message** → Chat Controller
2. **Message Analysis** → Determines if MCP tools should be used
3. **MCP Tool Call** → JSON-RPC 2.0 request to MCP Server
4. **MCP Server** → Calls external Plan API
5. **Response** → MCP Server → AI Agent Chat → User

---

## 📡 JSON-RPC 2.0 Protocol

### Request Structure
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
```

### Response Structure
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Tool execution result"
      }
    ],
    "isError": false
  }
}
```

### Error Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": "Detailed error information"
  }
}
```

---

## 🔧 Backend Implementation

### 1. MCP Configuration (`backend/src/config/mcpConfig.ts`)

```typescript
export interface MCPConfig {
  enabled: boolean;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  systemPrompt: string;
  toolCallFormat: string;
}

export const MCP_CONFIG: MCPConfig = {
  enabled: process.env.MCP_ENABLED === 'true',
  baseUrl: process.env.MCP_SERVER_URL || 'http://localhost:8080',
  timeout: parseInt(process.env.MCP_TIMEOUT || '10000'),
  retryAttempts: parseInt(process.env.MCP_RETRY_ATTEMPTS || '3'),
  systemPrompt: `
You are an AI assistant with access to MCP (Model Context Protocol) tools.
When users ask questions that can be answered using available tools, use them.
Always provide helpful and clear explanations based on the tool results.
  `.trim(),
  toolCallFormat: 'TOOL_CALL:toolName:{"param1":"value1","param2":"value2"}'
};
```

### 2. MCP Client Service (`backend/src/services/mcpClient.ts`)

```typescript
export class MCPClient {
  private config: MCPConfig;
  private requestId: number = 0;

  constructor(config: MCPConfig) {
    this.config = config;
  }

  /**
   * Call a specific MCP tool
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<string> {
    const requestBody = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        timeout: this.config.timeout
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
   * Get all available tools from MCP server
   */
  async getAvailableTools(): Promise<any[]> {
    const requestBody = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/list',
      params: {}
    };

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        timeout: this.config.timeout
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
   * Initialize MCP server connection
   */
  async initialize(): Promise<boolean> {
    try {
      const requestBody = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'initialize',
        params: {}
      };

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        timeout: this.config.timeout
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message}`);
      }

      console.log('✅ MCP Server initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize MCP server:', error);
      return false;
    }
  }

  /**
   * Check MCP server health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/actuator/health`, {
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

### 3. MCP Context Service (`backend/src/services/mcpContextService.ts`)

```typescript
export class MCPContextService {
  private mcpClient: MCPClient;
  private config: MCPConfig;

  constructor(mcpClient: MCPClient, config: MCPConfig) {
    this.mcpClient = mcpClient;
    this.config = config;
  }

  /**
   * Get MCP tools context for LLM
   */
  async getMCPToolsContext(): Promise<string> {
    try {
      const tools = await this.mcpClient.getAvailableTools();
      
      const toolsDescription = tools.map(tool => {
        return `
Tool: ${tool.name}
Description: ${tool.description}
Parameters: ${JSON.stringify(tool.inputSchema, null, 2)}
        `.trim();
      }).join('\n\n');

      return `
${this.config.systemPrompt}

Available MCP tools:
${toolsDescription}

Tool call format: ${this.config.toolCallFormat}
      `.trim();
    } catch (error) {
      console.error('Failed to get MCP tools context:', error);
      return 'MCP tools are currently unavailable.';
    }
  }

  /**
   * Get available tools list
   */
  async getAvailableTools(): Promise<any[]> {
    try {
      return await this.mcpClient.getAvailableTools();
    } catch (error) {
      console.error('Failed to get available tools:', error);
      return [];
    }
  }

  /**
   * Get MCP server status
   */
  async getMCPStatus(): Promise<{
    healthy: boolean;
    initialized: boolean;
    toolsCount: number;
    serverInfo?: any;
  }> {
    try {
      const healthy = await this.mcpClient.healthCheck();
      const tools = await this.getAvailableTools();
      const serverInfo = await this.mcpClient.getServerInfo();

      return {
        healthy,
        initialized: healthy,
        toolsCount: tools.length,
        serverInfo
      };
    } catch (error) {
      console.error('Failed to get MCP status:', error);
      return {
        healthy: false,
        initialized: false,
        toolsCount: 0
      };
    }
  }
}
```

---

## 🔗 Chat Controller Integration

### Enhanced Chat Controller

```typescript
export class ChatController {
  private mcpClient?: MCPClient;
  private mcpContextService?: MCPContextService;
  private mcpEnabled: boolean;

  constructor() {
    this.mcpEnabled = MCP_CONFIG.enabled;
    
    if (this.mcpEnabled) {
      this.mcpClient = new MCPClient(MCP_CONFIG);
      this.mcpContextService = new MCPContextService(this.mcpClient, MCP_CONFIG);
      this.initializeMCP();
    }
  }

  private async initializeMCP(): Promise<void> {
    try {
      const isHealthy = await this.mcpClient!.healthCheck();
      if (!isHealthy) {
        console.warn('⚠️ MCP Server is not healthy, disabling MCP features');
        this.mcpEnabled = false;
        return;
      }

      const initialized = await this.mcpClient!.initialize();
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

  /**
   * Send a message to an existing chat with MCP integration
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { chatId } = req.params;
      const { content, role = MessageRole.USER } = req.body;

      // Add user message to database
      const userMessage = await databaseService.addMessage(
        chatId,
        role,
        content
      );

      // Get chat history
      const chat = await databaseService.getChat(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      // Prepare messages for LLM
      const messages = chat.messages;

      let aiResponse: GeminiResponse;

      if (this.mcpEnabled && this.mcpContextService) {
        try {
          // Get MCP tools context
          const mcpContext = await this.mcpContextService.getMCPToolsContext();
          
          // Add MCP context to system message
          const systemMessage: Message = {
            id: 'system',
            chatId: chatId,
            role: MessageRole.SYSTEM,
            content: mcpContext,
            createdAt: new Date()
          };

          // Send to Gemini with MCP context
          const messagesWithContext = [systemMessage, ...messages];
          aiResponse = await geminiService.sendMessage(messagesWithContext);

          // Check if response contains tool calls
          if (aiResponse.content.includes('TOOL_CALL:')) {
            const toolResult = await this.executeToolCall(aiResponse.content);
            if (toolResult) {
              // Generate final response with tool results
              const finalMessages = [
                ...messages,
                {
                  id: 'assistant',
                  chatId: chatId,
                  role: MessageRole.ASSISTANT,
                  content: aiResponse.content,
                  createdAt: new Date()
                },
                {
                  id: 'tool_result',
                  chatId: chatId,
                  role: MessageRole.SYSTEM,
                  content: `Tool Result: ${toolResult}`,
                  createdAt: new Date()
                }
              ];

              const finalResponse = await geminiService.sendMessage(finalMessages);
              aiResponse = finalResponse;
            }
          }
        } catch (mcpError) {
          console.warn('⚠️ MCP integration failed, falling back to standard Gemini:', mcpError);
          aiResponse = await geminiService.sendMessage(messages);
        }
      } else {
        // Standard Gemini response without MCP
        aiResponse = await geminiService.sendMessage(messages);
      }

      // Add AI response to database
      const assistantMessage = await databaseService.addMessage(
        chatId,
        MessageRole.ASSISTANT,
        aiResponse.content
      );

      res.json({
        success: true,
        data: assistantMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  /**
   * Execute tool call from LLM response
   */
  private async executeToolCall(response: string): Promise<string | null> {
    try {
      const toolCallMatch = response.match(/TOOL_CALL:(\w+):(.+)/);
      if (!toolCallMatch) {
        return null;
      }

      const [, toolName, argsJson] = toolCallMatch;
      const args = JSON.parse(argsJson);

      console.log(`🔧 Executing MCP tool: ${toolName}`, args);
      const result = await this.mcpClient!.callTool(toolName, args);
      
      return result;
    } catch (error) {
      console.error('❌ Tool execution failed:', error);
      return `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
```

---

## ⚙️ Configuration and Deployment

### Environment Variables

```env
# MCP Configuration
MCP_ENABLED=true
MCP_SERVER_URL=http://localhost:8080
MCP_TIMEOUT=10000
MCP_RETRY_ATTEMPTS=3

# Gemini API (existing)
GEMINI_API_KEY=your_gemini_api_key

# Database (existing)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_agent_chat
```

### Docker Compose for MCP Server

```yaml
version: '3.8'

services:
  mcp-server:
    image: your-mcp-server:latest
    container_name: ai-agent-chat-mcp
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - PLAN_API_URL=${PLAN_API_URL}
      - PLAN_API_KEY=${PLAN_API_KEY}
    ports:
      - "8080:8080"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// backend/src/services/__tests__/mcpClient.test.ts
describe('MCPClient', () => {
  let mcpClient: MCPClient;
  let mockConfig: MCPConfig;

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      baseUrl: 'http://localhost:8080',
      timeout: 10000,
      retryAttempts: 3,
      systemPrompt: 'Test prompt',
      toolCallFormat: 'TOOL_CALL:toolName:args'
    };
    mcpClient = new MCPClient(mockConfig);
  });

  describe('callTool', () => {
    it('should call MCP tool successfully', async () => {
      // Mock fetch response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: {
            content: [{ type: 'text', text: 'Tool result' }],
            isError: false
          }
        })
      });

      const result = await mcpClient.callTool('testTool', { param: 'value' });
      expect(result).toBe('Tool result');
    });

    it('should handle MCP errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32603,
            message: 'Internal error'
          }
        })
      });

      await expect(mcpClient.callTool('testTool', {})).rejects.toThrow('MCP Error: Internal error');
    });
  });
});
```

### Integration Tests

```typescript
// backend/src/test/mcp-integration.test.ts
describe('MCP Integration', () => {
  let app: Express;
  let mcpServer: any;

  beforeAll(async () => {
    // Start MCP server for testing
    mcpServer = await startTestMCPServer();
    app = createTestApp();
  });

  afterAll(async () => {
    await mcpServer.close();
  });

  it('should send message with MCP integration', async () => {
    const response = await request(app)
      .post('/api/chats/test-chat/messages')
      .send({
        content: 'Show me all segments for tenant 12992',
        role: 'user'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toContain('segments');
  });
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. MCP Server Connection Failed
```
Error: Failed to connect to MCP server
```
**Solution:**
- Check if MCP server is running: `curl http://localhost:8080/actuator/health`
- Verify MCP_SERVER_URL environment variable
- Check network connectivity

#### 2. Tool Call Timeout
```
Error: MCP tool call timeout
```
**Solution:**
- Increase MCP_TIMEOUT value
- Check MCP server performance
- Verify tool execution time

#### 3. Invalid Tool Response
```
Error: Invalid MCP response structure
```
**Solution:**
- Check MCP server logs
- Verify tool implementation
- Test tool directly with MCP server

### Debug Commands

```bash
# Check MCP server health
curl http://localhost:8080/actuator/health

# Test MCP tool directly
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# Check application logs
docker logs ai-agent-chat-mcp
```

---

## 📊 Performance and Monitoring

### Metrics to Monitor

1. **MCP Server Response Time**
   - Average response time per tool call
   - 95th percentile response time
   - Timeout rate

2. **Tool Usage**
   - Most used tools
   - Tool success rate
   - Error rate by tool

3. **System Health**
   - MCP server availability
   - Connection pool status
   - Memory usage

### Monitoring Setup

```typescript
// backend/src/middleware/mcpMetrics.ts
export const mcpMetrics = {
  toolCallDuration: new prometheus.Histogram({
    name: 'mcp_tool_call_duration_seconds',
    help: 'Duration of MCP tool calls',
    labelNames: ['tool_name', 'status']
  }),

  toolCallTotal: new prometheus.Counter({
    name: 'mcp_tool_calls_total',
    help: 'Total number of MCP tool calls',
    labelNames: ['tool_name', 'status']
  }),

  mcpServerHealth: new prometheus.Gauge({
    name: 'mcp_server_health',
    help: 'MCP server health status (1 = healthy, 0 = unhealthy)'
  })
};
```

---

## 🚀 Next Steps

1. **Multi-MCP Support**: Support for multiple MCP servers
2. **Tool Caching**: Cache tool results for better performance
3. **Advanced Error Handling**: Retry logic for specific error types
4. **Tool Discovery**: Dynamic tool discovery and registration
5. **Performance Optimization**: Connection pooling and request batching

---

**Status**: ✅ **COMPLETED**  
**Completion Date**: December 2024  
**Next Phase**: Multi-LLM Support
