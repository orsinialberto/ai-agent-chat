/**
 * Authentication Routes
 */

import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no authentication required)
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

// Protected routes (authentication required)
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.get('/me', authenticate, (req, res) => authController.getCurrentUser(req, res));
router.put('/password', authenticate, (req, res) => authController.changePassword(req, res));
router.delete('/account', authenticate, (req, res) => authController.deleteAccount(req, res));

export default router;

