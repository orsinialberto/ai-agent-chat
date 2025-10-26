/**
 * MCP Client Service
 * Handles communication with MCP server using JSON-RPC 2.0 protocol
 */

import { MCPConfig } from '../config/mcpConfig';

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

    console.log(`🔧 Calling MCP tool: ${toolName}`, args);

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

  /**
   * Get MCP server information
   */
  async getServerInfo(): Promise<any> {
    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get MCP server info', error);
      return null;
    }
  }
}
