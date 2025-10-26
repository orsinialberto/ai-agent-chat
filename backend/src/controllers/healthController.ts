/**
 * Health Controller
 * Provides health check endpoints for all services including MCP
 */

import { Request, Response } from 'express';
import { databaseService } from '../services/databaseService';
import { geminiService } from '../services/geminiService';
import { MCPClient } from '../services/mcpClient';
import { MCPContextService } from '../services/mcpContextService';
import { MCP_CONFIG } from '../config/mcpConfig';

export class HealthController {
  private mcpClient?: MCPClient;
  private mcpContextService?: MCPContextService;
  private mcpEnabled: boolean;

  constructor() {
    this.mcpEnabled = MCP_CONFIG.enabled;
    
    if (this.mcpEnabled) {
      this.mcpClient = new MCPClient(MCP_CONFIG);
      this.mcpContextService = new MCPContextService(this.mcpClient, MCP_CONFIG);
    }
  }

  /**
   * Overall health check for all services
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: await this.checkDatabase(),
          gemini: await this.checkGemini(),
          mcp: await this.checkMCP()
        }
      };

      // Determine overall status
      const allHealthy = Object.values(health.services).every(status => status === true);
      health.status = allHealthy ? 'ok' : 'degraded';

      res.json(health);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Detailed health check with service information
   */
  async detailedHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: await this.getDatabaseHealth(),
          gemini: await this.getGeminiHealth(),
          mcp: await this.getMCPHealth()
        }
      };

      // Determine overall status
      const allHealthy = Object.values(health.services).every(service => service.status === 'healthy');
      health.status = allHealthy ? 'ok' : 'degraded';

      res.json(health);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabase(): Promise<boolean> {
    try {
      return await databaseService.testConnection();
    } catch (error: any) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Check Gemini API connection
   */
  private async checkGemini(): Promise<boolean> {
    try {
      return await geminiService.testConnection();
    } catch (error: any) {
      console.error('Gemini health check failed:', error);
      return false;
    }
  }

  /**
   * Check MCP server connection
   */
  private async checkMCP(): Promise<boolean> {
    if (!this.mcpEnabled || !this.mcpClient) {
      return false;
    }

    try {
      return await this.mcpClient.healthCheck();
    } catch (error: any) {
      console.error('MCP health check failed:', error);
      return false;
    }
  }

  /**
   * Get detailed database health information
   */
  private async getDatabaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      const isConnected = await databaseService.testConnection();
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        message: isConnected ? 'Database connection successful' : 'Database connection failed'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Database error: ${error.message}`
      };
    }
  }

  /**
   * Get detailed Gemini health information
   */
  private async getGeminiHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      const isConnected = await geminiService.testConnection();
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        message: isConnected ? 'Gemini API connection successful' : 'Gemini API connection failed'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Gemini API error: ${error.message}`
      };
    }
  }

  /**
   * Get detailed MCP health information
   */
  private async getMCPHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'disabled';
    message: string;
    details?: any;
  }> {
    if (!this.mcpEnabled) {
      return {
        status: 'disabled',
        message: 'MCP is disabled'
      };
    }

    if (!this.mcpClient || !this.mcpContextService) {
      return {
        status: 'unhealthy',
        message: 'MCP client not initialized'
      };
    }

    try {
      const mcpStatus = await this.mcpContextService.getMCPStatus();
      
      return {
        status: mcpStatus.healthy ? 'healthy' : 'unhealthy',
        message: mcpStatus.healthy ? 'MCP server is healthy' : 'MCP server is unhealthy',
        details: {
          healthy: mcpStatus.healthy,
          initialized: mcpStatus.initialized,
          toolsCount: mcpStatus.toolsCount,
          serverInfo: mcpStatus.serverInfo
        }
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `MCP error: ${error.message}`
      };
    }
  }

  /**
   * Get MCP server information
   */
  async getMCPInfo(req: Request, res: Response): Promise<void> {
    try {
      if (!this.mcpEnabled || !this.mcpContextService) {
        res.json({
          success: false,
          message: 'MCP is not enabled',
          mcpEnabled: false
        });
        return;
      }

      const status = await this.mcpContextService.getMCPStatus();
      
      res.json({
        success: true,
        data: status,
        mcpEnabled: this.mcpEnabled
      });
    } catch (error) {
      console.error('Error getting MCP info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get MCP information'
      });
    }
  }

  /**
   * Test MCP connection
   */
  async testMCPConnection(req: Request, res: Response): Promise<void> {
    try {
      if (!this.mcpEnabled || !this.mcpClient) {
        res.json({
          success: false,
          message: 'MCP is not enabled'
        });
        return;
      }

      const isHealthy = await this.mcpClient.healthCheck();
      const serverInfo = await this.mcpClient.getServerInfo();
      
      res.json({
        success: isHealthy,
        message: isHealthy ? 'MCP connection successful' : 'MCP connection failed',
        serverInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing MCP connection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test MCP connection'
      });
    }
  }
}

// Export singleton instance
export const healthController = new HealthController();
