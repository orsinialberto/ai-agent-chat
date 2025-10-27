import { MCPClient } from '../../services/mcpClient';
import { MCPConfig } from '../../config/mcpConfig';

// Mock global fetch
global.fetch = jest.fn();

describe('MCPClient', () => {
  let client: MCPClient;
  let config: MCPConfig;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    config = {
      baseUrl: 'http://localhost:8080/mcp',
      timeout: 5000,
      enabled: true,
      retryAttempts: 3,
      systemPrompt: 'Test system prompt',
      toolCallFormat: 'TEST_FORMAT'
    };
    
    client = new MCPClient(config);
    mockFetch = global.fetch as jest.Mock;
    mockFetch.mockClear();
  });

  describe('callTool', () => {
    it('should successfully call a tool', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [{ type: 'text', text: 'Tool result' }],
          isError: false
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.callTool('testTool', { param: 'value' });

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toBe('Tool result');
    });

    it('should handle JSON-RPC error response', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: 'Internal error'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await expect(client.callTool('testTool', {})).rejects.toThrow('Internal error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(client.callTool('testTool', {})).rejects.toThrow('HTTP 500');
    });

    it('should timeout on slow responses', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 6000))
      );

      await expect(client.callTool('testTool', {})).rejects.toThrow();
    });

    it('should handle invalid response structure', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await expect(client.callTool('testTool', {})).rejects.toThrow('Invalid MCP response structure');
    });
  });

  describe('getAvailableTools', () => {
    it('should get available tools successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          tools: [
            { name: 'tool1', description: 'Tool 1' },
            { name: 'tool2', description: 'Tool 2' }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const tools = await client.getAvailableTools();

      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('tool1');
    });

    it('should handle error when getting tools', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: 'Internal error'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await expect(client.getAvailableTools()).rejects.toThrow('MCP Error');
    });

    it('should return empty array when no tools available', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          tools: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const tools = await client.getAvailableTools();

      expect(tools).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('should initialize MCP server successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { initialized: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.initialize();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should return false on initialization error', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: 'Initialization failed'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.initialize();

      expect(result).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return true when server is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'UP' })
      } as Response);

      const result = await client.healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/actuator/health'),
        expect.any(Object)
      );
    });

    it('should return false when server is unhealthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503
      } as Response);

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getServerInfo', () => {
    it('should get server info successfully', async () => {
      const mockInfo = { name: 'MCP Server', version: '1.0.0' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfo
      } as Response);

      const info = await client.getServerInfo();

      expect(info).toEqual(mockInfo);
    });

    it('should return null when server is not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      } as Response);

      const info = await client.getServerInfo();

      expect(info).toBeNull();
    });

    it('should return null on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const info = await client.getServerInfo();

      expect(info).toBeNull();
    });
  });
});

