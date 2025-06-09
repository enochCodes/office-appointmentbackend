import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth'; // For the /me route

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email address.')
      .normalizeEmail(), // Sanitize email
    body('password')
      .isString() // Ensure password is a string
      .notEmpty().withMessage('Password is required.'),
  ],
  authController.login
);

// GET /api/auth/me - Protected route to get current user's profile
router.get(
  '/me',
  authenticateToken, // Apply authentication middleware
  authController.getMe
);

export default router;
