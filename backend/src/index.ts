import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import controllers
import { chatController } from './controllers/chatController';
import { healthController } from './controllers/healthController';

// API routes
app.post('/api/chats', (req, res) => chatController.createChat(req, res));
app.get('/api/chats', (req, res) => chatController.getChats(req, res));
app.get('/api/chats/:chatId', (req, res) => chatController.getChat(req, res));
app.put('/api/chats/:chatId', (req, res) => chatController.updateChat(req, res));
app.delete('/api/chats/:chatId', (req, res) => chatController.deleteChat(req, res));
app.post('/api/chats/:chatId/messages', (req, res) => chatController.sendMessage(req, res));
app.get('/api/test/gemini', (req, res) => chatController.testConnection(req, res));
app.get('/api/test/database', (req, res) => chatController.testDatabase(req, res));

// Health check routes
app.get('/api/health', (req, res) => healthController.healthCheck(req, res));
app.get('/api/health/detailed', (req, res) => healthController.detailedHealthCheck(req, res));
app.get('/api/health/mcp', (req, res) => healthController.getMCPInfo(req, res));
app.get('/api/test/mcp', (req, res) => healthController.testMCPConnection(req, res));
app.get('/api/mcp/status', (req, res) => chatController.getMCPStatus(req, res));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
