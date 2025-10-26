/**
 * MCP (Model Context Protocol) Configuration
 * Simple configuration for single MCP server integration
 */

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
