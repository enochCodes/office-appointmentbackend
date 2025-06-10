import { Router } from 'express';
import { body } from 'express-validator';
import adminController from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([Role.ADMIN]));

// POST /api/admin/users
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
  adminController.createUser
);

// POST /api/admin/directors
router.post(
  '/directors',
  [
    body('userId').notEmpty().withMessage('User ID is required.').isCUID().withMessage('User ID must be a valid CUID.'),
    body('department').notEmpty().withMessage('Department is required.').trim().escape(),
    body('officeLocation').notEmpty().withMessage('Office location is required.').trim().escape(),
  ],
  adminController.createDirector
);

// POST /api/admin/assistants
router.post(
  '/assistants',
  [
    body('userId').notEmpty().withMessage('User ID is required.').isCUID().withMessage('User ID must be a valid CUID.'),
    body('directorId').notEmpty().withMessage('Director ID for linking is required.').isCUID().withMessage('Director ID must be a valid CUID.'),
  ],
  adminController.createAssistant
);

export default router;
