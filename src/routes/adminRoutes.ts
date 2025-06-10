import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator'; // Added param and query
import adminController from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

function asyncHandler(fn: any) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const CUID_REGEX = /^[a-z0-9]{25}$/; // Basic CUID format

const validateUserIdParam = [
  param('userId')
    .isString().withMessage('User ID path parameter must be a string.')
    .matches(CUID_REGEX).withMessage('User ID path parameter must be a valid CUID format.')
];

const validateDirectorIdParam = [
  param('directorId')
    .isString().withMessage('Director ID path parameter must be a string.')
    .matches(CUID_REGEX).withMessage('Director ID path parameter must be a valid CUID format.')
];

const validateAssistantIdParam = [
  param('assistantId')
    .isString().withMessage('Assistant ID path parameter must be a string.')
    .matches(CUID_REGEX).withMessage('Assistant ID path parameter must be a valid CUID format.')
];

// Apply authentication and ADMIN role authorization to all routes in this file
router.use(authenticateToken);
router.use(authorizeRole([Role.ADMIN]));

// Section: User Management by Admin

// GET /api/admin/users - List users, with optional role filtering
router.get(
  '/users',
  [ // Optional query parameter validation
    query('role').optional().isIn(Object.values(Role))
      .withMessage('Invalid role filter. Valid roles are: ' + Object.values(Role).join(', '))
  ],
  asyncHandler(adminController.listUsersHandler)
);

// GET /api/admin/users/:userId - Get a specific user by ID
router.get(
  '/users/:userId',
  validateUserIdParam,
  asyncHandler(adminController.getUserByIdHandler)
);

// PUT /api/admin/users/:userId - Update a user's details (name, email, phone, role)
router.put(
  '/users/:userId',
  [
    ...validateUserIdParam, // Validate path parameter
    body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string.').trim().escape(),
    body('email').optional().isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Please provide a valid phone number.').trim().escape(),
    body('role').optional().isIn(Object.values(Role))
      .withMessage('Invalid role specified. Valid roles are: ' + Object.values(Role).join(', ')),
    // Password changes are not handled by this endpoint for admins
  ],
  asyncHandler(adminController.updateUserHandler)
);

// DELETE /api/admin/users/:userId - Delete a user
router.delete(
  '/users/:userId',
  validateUserIdParam,
  asyncHandler(adminController.deleteUserHandler)
);


// Section: Existing routes for creating users and profiles
// (These are kept as they are, but now clearly separated)

// POST /api/admin/users - Create a new user (can be any role)
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

// POST /api/admin/directors - Create a director profile for an existing user
router.post(
  '/directors',
  [
    body('userId').matches(CUID_REGEX).withMessage('User ID must be a valid CUID format.'),
    body('department').notEmpty().withMessage('Department is required.').trim().escape(),
    body('officeLocation').notEmpty().withMessage('Office location is required.').trim().escape(),
  ],
  asyncHandler(adminController.createDirector)
);

// POST /api/admin/assistants - Create an assistant profile for an existing user
router.post(
  '/assistants',
  [
    body('userId').matches(CUID_REGEX).withMessage('User ID must be a valid CUID format.'),
    body('directorId').matches(CUID_REGEX).withMessage('Director ID for linking must be a valid CUID format.'),
  ],
  asyncHandler(adminController.createAssistant)
);

// Section: Director Profile Management by Admin

// GET /api/admin/directors - List all director profiles
router.get(
  '/directors',
  asyncHandler(adminController.listDirectorsHandler)
);

// GET /api/admin/directors/:directorId - Get a specific director profile
router.get(
  '/directors/:directorId',
  validateDirectorIdParam,
  asyncHandler(adminController.getDirectorByIdHandler)
);

// PUT /api/admin/directors/:directorId - Update a director's profile
router.put(
  '/directors/:directorId',
  [
    ...validateDirectorIdParam,
    body('department').optional().isString().notEmpty().withMessage('Department must be a non-empty string.').trim().escape(),
    body('officeLocation').optional().isString().notEmpty().withMessage('Office location must be a non-empty string.').trim().escape(),
  ],
  asyncHandler(adminController.updateDirectorHandler)
);

// DELETE /api/admin/directors/:directorId - Delete a director profile
router.delete(
  '/directors/:directorId',
  validateDirectorIdParam,
  asyncHandler(adminController.deleteDirectorHandler)
);

// Section: Assistant Profile Management by Admin

// GET /api/admin/assistants - List all assistant profiles
router.get(
  '/assistants',
  asyncHandler(adminController.listAssistantsHandler)
);

// GET /api/admin/assistants/:assistantId - Get a specific assistant profile
router.get(
  '/assistants/:assistantId',
  validateAssistantIdParam,
  asyncHandler(adminController.getAssistantByIdHandler)
);

// PUT /api/admin/assistants/:assistantId - Update an assistant's profile (e.g., reassign director)
router.put(
  '/assistants/:assistantId',
  [
    ...validateAssistantIdParam,
    body('directorId').optional().matches(CUID_REGEX).withMessage('New Director ID must be a valid CUID format if provided.'),
  ],
  asyncHandler(adminController.updateAssistantHandler)
);

// DELETE /api/admin/assistants/:assistantId - Delete an assistant profile
router.delete(
  '/assistants/:assistantId',
  validateAssistantIdParam,
  asyncHandler(adminController.deleteAssistantHandler)
);

export default router;
