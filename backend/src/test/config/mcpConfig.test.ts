import { MCP_CONFIG } from '../../config/mcpConfig';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Mock fs and yaml modules
jest.mock('fs');
jest.mock('js-yaml');

describe('MCPConfig', () => {
  const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
  const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
  const mockYamlLoad = yaml.load as jest.MockedFunction<typeof yaml.load>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear module cache to reload config
    jest.resetModules();
  });

  describe('loadMCPConfig - File exists', () => {
    it('should load complete configuration from YAML file successfully', () => {
      const mockYamlContent = `
base_url: 'http://mcp-server:8080'
timeout: 5000
retry_attempts: 5
system_prompt: |
  Test system prompt
tool_call_format: 'TOOL_CALL:test:{}'
      `;

      const mockConfig = {
        base_url: 'http://mcp-server:8080',
        timeout: 5000,
        retry_attempts: 5,
        system_prompt: 'Test system prompt',
        tool_call_format: 'TOOL_CALL:test:{}'
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockYamlContent);
      mockYamlLoad.mockReturnValue(mockConfig);

      // Reload the module to trigger the config loading
      delete require.cache[require.resolve('../../config/mcpConfig')];
      const { MCP_CONFIG } = require('../../config/mcpConfig');

      expect(MCP_CONFIG.enabled).toBe(true);
      expect(MCP_CONFIG.baseUrl).toBe('http://mcp-server:8080');
      expect(MCP_CONFIG.timeout).toBe(5000);
      expect(MCP_CONFIG.retryAttempts).toBe(5);
      expect(MCP_CONFIG.systemPrompt).toBe('Test system prompt');
      expect(MCP_CONFIG.toolCallFormat).toBe('TOOL_CALL:test:{}');
    });

    it('should enable MCP when config file exists', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('test yaml content');
      mockYamlLoad.mockReturnValue({
        base_url: 'http://localhost:8080',
        timeout: 10000,
        retry_attempts: 3,
        system_prompt: 'Default prompt',
        tool_call_format: 'TOOL_CALL:test:{}'
      });

      delete require.cache[require.resolve('../../config/mcpConfig')];
      const { MCP_CONFIG } = require('../../config/mcpConfig');

      expect(MCP_CONFIG.enabled).toBe(true);
    });
  });

  describe('loadMCPConfig - File does not exist', () => {
    it('should disable MCP when config file does not exist', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      mockExistsSync.mockReturnValue(false);

      delete require.cache[require.resolve('../../config/mcpConfig')];
      const { MCP_CONFIG } = require('../../config/mcpConfig');

      expect(MCP_CONFIG.enabled).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('MCP config file not found. MCP server will be disabled.');

      consoleLogSpy.mockRestore();
    });

    it('should use default values when config file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      delete require.cache[require.resolve('../../config/mcpConfig')];
      const { MCP_CONFIG } = require('../../config/mcpConfig');

      expect(MCP_CONFIG.baseUrl).toBe('http://localhost:8080');
      expect(MCP_CONFIG.timeout).toBe(10000);
      expect(MCP_CONFIG.retryAttempts).toBe(3);
    });
  });

  describe('loadMCPConfig - File read error', () => {
    it('should handle file read errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      delete require.cache[require.resolve('../../config/mcpConfig')];
      const { MCP_CONFIG } = require('../../config/mcpConfig');

      expect(MCP_CONFIG.enabled).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle YAML parsing errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid yaml content');
      mockYamlLoad.mockImplementation(() => {
        throw new Error('YAML parsing error');
      });

      delete require.cache[require.resolve('../../config/mcpConfig')];
      const { MCP_CONFIG } = require('../../config/mcpConfig');

      expect(MCP_CONFIG.enabled).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('MCP_CONFIG default values', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(false);
      delete require.cache[require.resolve('../../config/mcpConfig')];
      require('../../config/mcpConfig');
    });

    it('should have sensible defaults when config is not loaded', () => {
      expect(MCP_CONFIG.enabled).toBe(false);
      expect(MCP_CONFIG.baseUrl).toBeDefined();
      expect(MCP_CONFIG.timeout).toBeGreaterThan(0);
      expect(MCP_CONFIG.retryAttempts).toBeGreaterThan(0);
      expect(MCP_CONFIG.systemPrompt).toBeDefined();
      expect(MCP_CONFIG.toolCallFormat).toBeDefined();
    });

    it('should have correct types for all properties', () => {
      expect(typeof MCP_CONFIG.enabled).toBe('boolean');
      expect(typeof MCP_CONFIG.baseUrl).toBe('string');
      expect(typeof MCP_CONFIG.timeout).toBe('number');
      expect(typeof MCP_CONFIG.retryAttempts).toBe('number');
      expect(typeof MCP_CONFIG.systemPrompt).toBe('string');
      expect(typeof MCP_CONFIG.toolCallFormat).toBe('string');
    });
  });
});

