/**
 * OAuth Configuration
 * Configuration for OAuth mock server integration
 * 
 * If oauth-config.yml exists, OAuth will be enabled.
 * If it doesn't exist, OAuth will be disabled (used only when MCP is enabled).
 */

import fs from 'fs';
import path from 'path';
// @ts-ignore - js-yaml doesn't have type definitions by default
import yaml from 'js-yaml';

interface OAuthYamlConfig {
  oauth: {
    mock_server_url: string;
    token_endpoint: string;
    timeout: number;
    client_id?: string;
    client_secret?: string;
  };
}

export interface OAuthConfig {
  enabled: boolean;
  mockServerUrl: string;
  tokenEndpoint: string;
  timeout: number;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Load OAuth configuration from YAML file
 * Returns null if file doesn't exist or can't be loaded
 */
function loadOAuthConfig(): OAuthYamlConfig | null {
  try {
    const yamlPath = path.join(__dirname, '../../config/oauth-config.yml');
    
    // Check if file exists
    if (!fs.existsSync(yamlPath)) {
      console.log('OAuth config file not found. OAuth will be disabled.');
      return null;
    }

    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const config = yaml.load(yamlContent) as OAuthYamlConfig;
    
    console.log('OAuth config loaded successfully.');
    return config;
  } catch (error) {
    console.error('Error loading OAuth configuration:', error);
    return null;
  }
}

const yamlConfig = loadOAuthConfig();
const oauthEnabled = yamlConfig !== null;

export const OAUTH_CONFIG: OAuthConfig = {
  enabled: oauthEnabled,
  mockServerUrl: yamlConfig?.oauth?.mock_server_url || 'http://localhost:9000',
  tokenEndpoint: yamlConfig?.oauth?.token_endpoint || '/oauth/token',
  timeout: yamlConfig?.oauth?.timeout || 5000,
  clientId: yamlConfig?.oauth?.client_id,
  clientSecret: yamlConfig?.oauth?.client_secret
};

/**
 * Check if OAuth is enabled
 */
export function isOAuthEnabled(): boolean {
  return OAUTH_CONFIG.enabled;
}

