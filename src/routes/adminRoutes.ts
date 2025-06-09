import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import adminController from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Helper to wrap async route handlers for Express compatibility
function asyncHandler(fn: any) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Apply authentication and ADMIN role authorization to all routes in this file
router.use(authenticateToken);
router.use(authorizeRole([Role.ADMIN]));

// POST /api/admin/users - Create a new user (can be any role including ADMIN, DIRECTOR, ASSISTANT, USER)
router.post(
  '/users',
  [
    body('name').notEmpty().withMessage('Name is required.').trim().escape(),
    body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Valid phone number required if provided.').trim().escape(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('role').isIn(Object.values(Role))
      .withMessage('Invalid role specified. Valid roles are: ' + Object.values(Role).join(', ')),
  ],
  asyncHandler(adminController.createUser)
);

// POST /api/admin/directors - Create a director profile for an existing user (who should have DIRECTOR role)
router.post(
  '/directors',
  [
    body('userId').notEmpty().withMessage('User ID is required.').isString().trim(), // .isCUID() if applicable
    body('department').notEmpty().withMessage('Department is required.').trim().escape(),
    body('officeLocation').notEmpty().withMessage('Office location is required.').trim().escape(),
  ],
  asyncHandler(adminController.createDirector)
);

// POST /api/admin/assistants - Create an assistant profile for an existing user (who should have ASSISTANT role)
router.post(
  '/assistants',
  [
    body('userId').notEmpty().withMessage('User ID is required.').isString().trim(), // .isCUID() if applicable
    body('directorId').notEmpty().withMessage('Director ID for linking is required.').isString().trim(), // .isCUID()
  ],
  asyncHandler(adminController.createAssistant)
);

export default router;
