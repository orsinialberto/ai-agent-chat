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

// Rate limiting - più permissivo per sviluppo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (più permissivo)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - più permissiva per sviluppo
app.use(cors({
  origin: function (origin, callback) {
    // Permetti richieste senza origin (es. mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // In sviluppo, permetti localhost su qualsiasi porta
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // In produzione, usa solo l'URL configurato
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

// Import controllers and middleware
import { chatController } from './controllers/chatController';
import { healthController } from './controllers/healthController';
import { authenticate } from './middleware/authMiddleware';
import authRoutes from './routes/auth';

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Chat API routes (protected - require authentication)
app.post('/api/chats', authenticate, (req, res) => chatController.createChat(req, res));
app.get('/api/chats', authenticate, (req, res) => chatController.getChats(req, res));
app.get('/api/chats/:chatId', authenticate, (req, res) => chatController.getChat(req, res));
app.put('/api/chats/:chatId', authenticate, (req, res) => chatController.updateChat(req, res));
app.delete('/api/chats/:chatId', authenticate, (req, res) => chatController.deleteChat(req, res));
app.post('/api/chats/:chatId/messages', authenticate, (req, res) => chatController.sendMessage(req, res));

// Test endpoints (can be public for development)
app.get('/api/test/gemini', (req, res) => chatController.testConnection(req, res));
app.get('/api/test/gemini/error-handling', (req, res) => chatController.testGeminiErrorHandling(req, res));
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
