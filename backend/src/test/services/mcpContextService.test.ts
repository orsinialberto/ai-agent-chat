import { MCPContextService } from '../../services/mcpContextService';
import { MCPClient } from '../../services/mcpClient';
import { MCPConfig } from '../../config/mcpConfig';

// Mock MCPClient
jest.mock('../../services/mcpClient');

describe('MCPContextService', () => {
  let service: MCPContextService;
  let mockMcpClient: jest.Mocked<MCPClient>;
  let config: MCPConfig;

  beforeEach(() => {
    config = {
      baseUrl: 'http://localhost:8080/mcp',
      timeout: 5000,
      enabled: true,
      retryAttempts: 3,
      systemPrompt: 'Test system prompt',
      toolCallFormat: 'TOOL_CALL:toolName:{...}'
    };

    mockMcpClient = new MCPClient(config) as jest.Mocked<MCPClient>;
    service = new MCPContextService(mockMcpClient, config);
    jest.clearAllMocks();
  });

  describe('getMCPToolsContext', () => {
    it('should return formatted context with tools', async () => {
      const mockTools = [
        {
          name: 'testTool',
          description: 'A test tool',
          inputSchema: {
            type: 'object',
            properties: {
              param1: { type: 'string' }
            }
          }
        }
      ];

      mockMcpClient.getAvailableTools.mockResolvedValue(mockTools);

      const context = await service.getMCPToolsContext();

      expect(context).toContain(config.systemPrompt);
      expect(context).toContain('Available MCP tools');
      expect(context).toContain('testTool');
      expect(context).toContain('A test tool');
      expect(context).toContain(config.toolCallFormat);
    });

    it('should handle multiple tools', async () => {
      const mockTools = [
        {
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: { type: 'object' }
        },
        {
          name: 'tool2',
          description: 'Tool 2',
          inputSchema: { type: 'object' }
        }
      ];

      mockMcpClient.getAvailableTools.mockResolvedValue(mockTools);

      const context = await service.getMCPToolsContext();

      expect(context).toContain('tool1');
      expect(context).toContain('tool2');
    });

    it('should return fallback message on error', async () => {
      mockMcpClient.getAvailableTools.mockRejectedValue(
        new Error('MCP error')
      );

      const context = await service.getMCPToolsContext();

      expect(context).toBe('MCP tools are currently unavailable.');
    });
  });

  describe('getAvailableTools', () => {
    it('should return available tools', async () => {
      const mockTools = [
        { name: 'tool1', description: 'Tool 1' },
        { name: 'tool2', description: 'Tool 2' }
      ];

      mockMcpClient.getAvailableTools.mockResolvedValue(mockTools);

      const tools = await service.getAvailableTools();

      expect(tools).toEqual(mockTools);
      expect(mockMcpClient.getAvailableTools).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockMcpClient.getAvailableTools.mockRejectedValue(
        new Error('Error getting tools')
      );

      const tools = await service.getAvailableTools();

      expect(tools).toEqual([]);
    });
  });

  describe('getMCPStatus', () => {
    it('should return healthy status when everything works', async () => {
      const mockTools = [
        { name: 'tool1', description: 'Tool 1' }
      ];
      const mockServerInfo = { name: 'MCP Server', version: '1.0.0' };

      mockMcpClient.healthCheck.mockResolvedValue(true);
      mockMcpClient.getAvailableTools.mockResolvedValue(mockTools);
      mockMcpClient.getServerInfo.mockResolvedValue(mockServerInfo);

      const status = await service.getMCPStatus();

      expect(status.healthy).toBe(true);
      expect(status.initialized).toBe(true);
      expect(status.toolsCount).toBe(1);
      expect(status.serverInfo).toEqual(mockServerInfo);
    });

    it('should return unhealthy status when health check fails', async () => {
      mockMcpClient.healthCheck.mockResolvedValue(false);
      mockMcpClient.getAvailableTools.mockResolvedValue([]);
      mockMcpClient.getServerInfo.mockResolvedValue(null);

      const status = await service.getMCPStatus();

      expect(status.healthy).toBe(false);
      expect(status.initialized).toBe(false);
      expect(status.toolsCount).toBe(0);
    });

    it('should return unhealthy status on error', async () => {
      mockMcpClient.healthCheck.mockRejectedValue(
        new Error('Health check failed')
      );
      mockMcpClient.getAvailableTools.mockResolvedValue([]);
      mockMcpClient.getServerInfo.mockResolvedValue(null);

      const status = await service.getMCPStatus();

      expect(status.healthy).toBe(false);
      expect(status.initialized).toBe(false);
      expect(status.toolsCount).toBe(0);
    });

    it('should count tools correctly', async () => {
      const mockTools = [
        { name: 'tool1' },
        { name: 'tool2' },
        { name: 'tool3' }
      ];

      mockMcpClient.healthCheck.mockResolvedValue(true);
      mockMcpClient.getAvailableTools.mockResolvedValue(mockTools);
      mockMcpClient.getServerInfo.mockResolvedValue(null);

      const status = await service.getMCPStatus();

      expect(status.toolsCount).toBe(3);
    });
  });
});

