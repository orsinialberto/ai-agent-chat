// Mock fs and yaml modules with factory functions
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

describe('MCPConfig', () => {
  let mockReadFileSync: jest.MockedFunction<any>;
  let mockExistsSync: jest.MockedFunction<any>;
  let mockYamlLoad: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Get mocked functions from the mocks
    const fs = require('fs');
    const yaml = require('js-yaml');
    mockReadFileSync = fs.readFileSync;
    mockExistsSync = fs.existsSync;
    mockYamlLoad = yaml.load;
    
    // Clear module cache before each test to ensure fresh load
    const configPath = require.resolve('../../config/mcpConfig');
    if (require.cache[configPath]) {
      delete require.cache[configPath];
    }
  });

  afterEach(() => {
    // Clear module cache after each test
    const configPath = require.resolve('../../config/mcpConfig');
    if (require.cache[configPath]) {
      delete require.cache[configPath];
    }
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

      // Clear module cache and reload
      const configPath = require.resolve('../../config/mcpConfig');
      delete require.cache[configPath];
      const { MCP_CONFIG } = require(configPath);

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

      const configPath = require.resolve('../../config/mcpConfig');
      delete require.cache[configPath];
      const { MCP_CONFIG } = require(configPath);

      expect(MCP_CONFIG.enabled).toBe(true);
    });
  });

  describe('loadMCPConfig - File does not exist', () => {
    it('should disable MCP when config file does not exist', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      mockExistsSync.mockReturnValue(false);

      const configPath = require.resolve('../../config/mcpConfig');
      delete require.cache[configPath];
      const { MCP_CONFIG } = require(configPath);

      expect(MCP_CONFIG.enabled).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('MCP config file not found. MCP server will be disabled.');

      consoleLogSpy.mockRestore();
    });

    it('should use default values when config file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const configPath = require.resolve('../../config/mcpConfig');
      delete require.cache[configPath];
      const { MCP_CONFIG } = require(configPath);

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

      const configPath = require.resolve('../../config/mcpConfig');
      delete require.cache[configPath];
      const { MCP_CONFIG } = require(configPath);

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

      const configPath = require.resolve('../../config/mcpConfig');
      delete require.cache[configPath];
      const { MCP_CONFIG } = require(configPath);

      expect(MCP_CONFIG.enabled).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('MCP_CONFIG default values', () => {
    let MCP_CONFIG: any;

    beforeEach(() => {
      mockExistsSync.mockReturnValue(false);
      const configPath = require.resolve('../../config/mcpConfig');
      delete require.cache[configPath];
      const configModule = require(configPath);
      MCP_CONFIG = configModule.MCP_CONFIG;
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

