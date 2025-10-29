/**
 * MCP (Model Context Protocol) Configuration
 * Simple configuration for single MCP server integration
 * 
 * If mcp-config.yml exists, the MCP server will be enabled with those settings.
 * If it doesn't exist, the MCP server will be disabled.
 */

import fs from 'fs';
import path from 'path';
// @ts-ignore - js-yaml doesn't have type definitions by default
import yaml from 'js-yaml';

interface MCPYamlConfig {
  base_url: string;
  timeout: number;
  retry_attempts: number;
  system_prompt: string;
  tool_call_format: string;
}

export interface MCPConfig {
  enabled: boolean;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  systemPrompt: string;
  toolCallFormat: string;
}

/**
 * Check if MCP config file exists
 */
function mcpConfigFileExists(): boolean {
  try {
    const yamlPath = path.join(__dirname, '../../config/mcp-config.yml');
    return fs.existsSync(yamlPath);
  } catch (error) {
    return false;
  }
}

/**
 * Load MCP configuration from YAML file
 * Returns null if file doesn't exist or can't be loaded
 */
function loadMCPConfig(): MCPYamlConfig | null {
  try {
    const yamlPath = path.join(__dirname, '../../config/mcp-config.yml');
    
    // Check if file exists
    if (!fs.existsSync(yamlPath)) {
      console.log('MCP config file not found. MCP server will be disabled.');
      return null;
    }

    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const config = yaml.load(yamlContent) as MCPYamlConfig;
    
    console.log('MCP config loaded successfully.');
    return config;
  } catch (error) {
    console.error('Error loading MCP configuration:', error);
    return null;
  }
}

const yamlConfig = loadMCPConfig();
const isMCPEnabled = yamlConfig !== null;

export const MCP_CONFIG: MCPConfig = {
  enabled: isMCPEnabled,
  baseUrl: yamlConfig?.base_url || 'http://localhost:8080',
  timeout: yamlConfig?.timeout || 10000,
  retryAttempts: yamlConfig?.retry_attempts || 3,
  systemPrompt: yamlConfig?.system_prompt?.trim() || 'You are an AI assistant with access to MCP (Model Context Protocol) tools.',
  toolCallFormat: yamlConfig?.tool_call_format || 'TOOL_CALL:toolName:{"param1":"value1","param2":"value2"}'
};
