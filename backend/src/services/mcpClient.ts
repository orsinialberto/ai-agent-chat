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
  private oauthToken?: string;

  constructor(config: MCPConfig, oauthToken?: string) {
    this.config = config;
    this.oauthToken = oauthToken;
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

    console.log(`🔧 MCP call: tools/call - ${toolName}`);
    console.debug(`📤 MCP Request (JSON-RPC):`, JSON.stringify(requestBody, null, 2));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add OAuth token if present
      if (this.oauthToken) {
        headers['Authorization'] = `Bearer ${this.oauthToken}`;
        console.debug('🔐 Adding OAuth token to MCP request');
      }

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MCPResponse = await response.json() as MCPResponse;
      console.debug(`📥 MCP Response (JSON-RPC):`, JSON.stringify(data, null, 2));
      
      // Handle JSON-RPC error response (proper format)
      if (data.error) {
        const errorMsg = data.error.message || 'Unknown MCP error';
        console.error('❌ MCP tool returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      // Handle legacy error format from old Java server implementation
      if (data.result && typeof data.result === 'object' && 'code' in data.result) {
        const resultAny = data.result as any;
        if (resultAny.code === 'error') {
          const errorMsg = resultAny.message || 'Unknown error';
          console.error('❌ MCP tool returned error (legacy format):', errorMsg);
          throw new Error(errorMsg);
        }
      }

      if (!data.result || !data.result.content || data.result.content.length === 0) {
        console.error('❌ Invalid response structure. Full response:', JSON.stringify(data, null, 2));
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

    console.log('🔧 MCP call: tools/list');
    console.debug('📤 MCP Request (JSON-RPC) - tools/list:', JSON.stringify(requestBody, null, 2));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add OAuth token if present
      if (this.oauthToken) {
        headers['Authorization'] = `Bearer ${this.oauthToken}`;
      }

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json() as any;
      console.debug('📥 MCP Response (JSON-RPC) - tools/list:', JSON.stringify(data, null, 2));
      
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

      console.log('🔧 MCP call: initialize');
      console.debug('📤 MCP Request (JSON-RPC) - initialize:', JSON.stringify(requestBody, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add OAuth token if present
      if (this.oauthToken) {
        headers['Authorization'] = `Bearer ${this.oauthToken}`;
      }

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json() as any;
      console.debug('📥 MCP Response (JSON-RPC) - initialize:', JSON.stringify(data, null, 2));
      
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}/actuator/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.config.baseUrl, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
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
