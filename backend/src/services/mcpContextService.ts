/**
 * MCP Context Service
 * Provides MCP tools context to LLM for intelligent tool selection
 */

import { MCPClient } from './mcpClient';
import { MCPConfig } from '../config/mcpConfig';

export class MCPContextService {
  private mcpClient: MCPClient;
  private config: MCPConfig;

  constructor(mcpClient: MCPClient, config: MCPConfig) {
    this.mcpClient = mcpClient;
    this.config = config;
  }

  /**
   * Get MCP client instance
   */
  getMCPClient(): MCPClient {
    return this.mcpClient;
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
