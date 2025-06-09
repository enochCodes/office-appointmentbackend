import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth'; // For the /me route

const router = Router();

// Helper to wrap async route handlers for Express compatibility
function asyncHandler(fn: any) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

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
  asyncHandler(authController.login)
);

// GET /api/auth/me - Protected route to get current user's profile
router.get(
  '/me',
  authenticateToken, // Apply authentication middleware
  asyncHandler(authController.getMe)
);

export default router;
