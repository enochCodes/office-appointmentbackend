import { Router } from 'express';
import { body, query, param } from 'express-validator';
import adminController from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([Role.ADMIN]));

// POST /users (create)
router.post('/users', [
    body('name').notEmpty().withMessage('Name is required.').trim().escape(),
    body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Valid phone number required if provided.').trim().escape(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('role').isIn(Object.values(Role)).withMessage('Invalid role specified. Valid roles are: ' + Object.values(Role).join(', ')),
], adminController.createUser);
// GET /users (list)
router.get('/users', [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be an integer (1-100).'),
    query('role').optional().toUpperCase().isIn(Object.values(Role)).withMessage('Invalid role specified. Valid roles are: ' + Object.values(Role).join(', ')),
], adminController.listUsers);
// GET /users/:id
router.get('/users/:id', [
    param('id').isCUID().withMessage('User ID parameter must be a valid CUID.')
], adminController.getUserById);

// PUT /api/admin/users/:id/role - Update a user's role
router.put(
  '/users/:id/role',
  [
    param('id').isCUID().withMessage('User ID parameter must be a valid CUID.'),
    body('role').isIn(Object.values(Role))
      .withMessage('Invalid new role specified. Valid roles are: ' + Object.values(Role).join(', ')),
  ],
  adminController.updateUserRole
);

// POST /directors (create)
router.post('/directors', [
    body('userId').notEmpty().isCUID().withMessage('User ID must be a valid CUID.'),
    body('department').notEmpty().withMessage('Department is required.').trim().escape(),
    body('officeLocation').notEmpty().withMessage('Office location is required.').trim().escape(),
], adminController.createDirector);
// GET /directors (list)
router.get('/directors', [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be an integer (1-100).'),
], adminController.listDirectorProfiles);

// POST /assistants (create)
router.post('/assistants', [
    body('userId').notEmpty().isCUID().withMessage('User ID must be a valid CUID.'),
    body('directorId').notEmpty().isCUID().withMessage('Director ID must be a valid CUID.'),
], adminController.createAssistant);
// GET /assistants (list)
router.get('/assistants', [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be an integer (1-100).'),
], adminController.listAssistantProfiles);

export default router;
