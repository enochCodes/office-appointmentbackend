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
  authenticateToken,
  asyncHandler(authController.getMe)
);

// PUT /api/auth/me - Update current user's profile (name, phone)
router.put(
  '/me',
  authenticateToken,
  [
    body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string if provided.').trim().escape(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Please provide a valid phone number if provided.').trim().escape(),
    // Ensure no other fields like email, role, password are processed by this route for self-update
    body('email').not().exists().withMessage('Email updates are not allowed via this endpoint.'),
    body('role').not().exists().withMessage('Role updates are not allowed via this endpoint.'),
    body('password').not().exists().withMessage('Password updates are not allowed via this endpoint. Use /me/change-password.')
  ],
  asyncHandler(authController.updateMyProfileHandler)
);

// POST /api/auth/me/change-password - Change current user's password
router.post(
  '/me/change-password',
  authenticateToken,
  [
    body('oldPassword').isString().notEmpty().withMessage('Old password is required.'),
    body('newPassword')
      .isString()
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
      // Optional: Add more complexity rules for newPassword if desired
      // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      // .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
  ],
  asyncHandler(authController.changeMyPasswordHandler)
);

export default router;
