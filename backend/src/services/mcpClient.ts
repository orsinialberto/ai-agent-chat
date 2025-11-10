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
   * Make a JSON-RPC 2.0 request to the MCP server
   * Handles common logic: request construction, headers, timeout, OAuth token, error handling
   */
  private async makeJsonRpcRequest(method: string, params: any): Promise<any> {
    const requestBody = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params
    };

    console.log(`🔧 MCP call: ${method}`);
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

      const data = await response.json() as any;
      console.debug(`📥 MCP Response (JSON-RPC):`, JSON.stringify(data, null, 2));

      // Handle JSON-RPC error response
      if (data.error) {
        const errorMsg = data.error.message || 'Unknown MCP error';
        console.error(`❌ MCP ${method} returned error:`, errorMsg);
        throw new Error(errorMsg);
      }

      return data.result;
    } catch (error) {
      // Clear timeout if still active (in case of error before timeout)
      console.error(`❌ MCP ${method} failed:`, error);
      throw error;
    }
  }

  /**
   * Call a specific MCP tool
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<string> {
    try {
      const result = await this.makeJsonRpcRequest('tools/call', {
        name: toolName,
        arguments: args
      });

      // Handle legacy error format from old Java server implementation
      if (result && typeof result === 'object' && 'code' in result) {
        const resultAny = result as any;
        if (resultAny.code === 'error') {
          const errorMsg = resultAny.message || 'Unknown error';
          console.error('❌ MCP tool returned error (legacy format):', errorMsg);
          throw new Error(errorMsg);
        }
      }

      if (!result || !result.content || result.content.length === 0) {
        console.error('❌ Invalid response structure. Full response:', JSON.stringify(result, null, 2));
        throw new Error('Invalid MCP response structure');
      }

      return result.content[0].text;
    } catch (error) {
      console.error(`❌ MCP tool call failed: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * Get all available tools from MCP server
   */
  async getAvailableTools(): Promise<any[]> {
    try {
      const result = await this.makeJsonRpcRequest('tools/list', {});
      return result?.tools || [];
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
      await this.makeJsonRpcRequest('initialize', {});
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
