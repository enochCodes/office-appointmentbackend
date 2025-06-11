import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator'; // Added param and query
import adminController from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

/**
 * @openapi
 * tags:
 *   - name: Admin - Users
 *     description: User management by administrators
 *   - name: Admin - Directors
 *     description: Director profile management by administrators
 *   - name: Admin - Assistants
 *     description: Assistant profile management by administrators
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     AdminUserCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           example: New User
 *         email:
 *           type: string
 *           format: email
 *           example: newuser@example.com
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+1234567890"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: securePa$$w0rd
 *         role:
 *           $ref: '#/components/schemas/Role' # Assuming Role schema is defined in swaggerConfig.ts
 *     AdminUserUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Updated User Name
 *         email:
 *           type: string
 *           format: email
 *           example: updateduser@example.com
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+1987654321"
 *         role:
 *           $ref: '#/components/schemas/Role'
 *         isActive:
 *           type: boolean
 *           example: true
 *     DirectorProfile: # For responses
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000abcdef12345
 *         userId:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000ghijklmnop
 *         department:
 *           type: string
 *           example: "Computer Science"
 *         officeLocation:
 *           type: string
 *           example: "Building A, Room 101"
 *         user: # Embed user details
 *           $ref: '#/components/schemas/User'
 *     AdminDirectorCreateRequest:
 *       type: object
 *       required:
 *         - userId
 *         - department
 *         - officeLocation
 *       properties:
 *         userId:
 *           type: string
 *           format: cuid
 *           description: ID of the existing user to become a director.
 *           example: clxkz21rb0000ghijklmnop
 *         department:
 *           type: string
 *           example: "Physics"
 *         officeLocation:
 *           type: string
 *           example: "Building C, Room 202"
 *     AdminDirectorUpdateRequest:
 *       type: object
 *       properties:
 *         department:
 *           type: string
 *           example: "Mathematics"
 *         officeLocation:
 *           type: string
 *           example: "Building D, Room 303"
 *     AssistantProfile: # For responses
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000qrstuvwxyz
 *         userId:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000abcdefghij
 *         directorId:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000ghijklmnop
 *         user: # Embed user details
 *           $ref: '#/components/schemas/User'
 *         director: # Optionally embed director basic info
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: cuid
 *             name: # Assuming director's user name
 *               type: string
 *     AdminAssistantCreateRequest:
 *       type: object
 *       required:
 *         - userId
 *         - directorId
 *       properties:
 *         userId:
 *           type: string
 *           format: cuid
 *           description: ID of the existing user to become an assistant.
 *           example: clxkz21rb0000abcdefghij
 *         directorId:
 *           type: string
 *           format: cuid
 *           description: ID of the director this assistant is assigned to.
 *           example: clxkz21rb0000ghijklmnop
 *     AdminAssistantUpdateRequest:
 *       type: object
 *       properties:
 *         directorId:
 *           type: string
 *           format: cuid
 *           description: ID of the new director to assign this assistant to.
 *           example: clxkz21rb0000stuvwxyz01
 *     SuccessMessageResponse: # Already defined in authRoutes, but good to have if used standalone
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Operation successful
 */

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

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin - Users]
 *     summary: List all users
 *     description: Retrieves a list of all users, with optional filtering by role. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           $ref: '#/components/schemas/Role'
 *         required: false
 *         description: Filter users by role.
 *     responses:
 *       '200':
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User' # Assuming User schema includes all relevant fields
 *       '400':
 *         description: Invalid role filter.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '500':
 *         description: Internal server error.
 */
router.get(
  '/users',
  [ // Optional query parameter validation
    query('role').optional().isIn(Object.values(Role))
      .withMessage('Invalid role filter. Valid roles are: ' + Object.values(Role).join(', '))
  ],
  asyncHandler(adminController.listUsersHandler)
);

/**
 * @openapi
 * /admin/users/{userId}:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Get a specific user by ID
 *     description: Retrieves details of a specific user by their ID. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the user to retrieve.
 *     responses:
 *       '200':
 *         description: User details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Invalid User ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.get(
  '/users/:userId',
  validateUserIdParam,
  asyncHandler(adminController.getUserByIdHandler)
);

/**
 * @openapi
 * /admin/users/{userId}:
 *   put:
 *     tags: [Admin - Users]
 *     summary: Update a user's details
 *     description: Updates a user's name, email, phone, role, or active status. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserUpdateRequest'
 *     responses:
 *       '200':
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User' # Returns the updated user
 *       '400':
 *         description: Validation error or invalid User ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.put(
  '/users/:userId',
  [
    ...validateUserIdParam, // Validate path parameter
    body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string.').trim().escape(),
    body('email').optional().isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Please provide a valid phone number.').trim().escape(),
    body('role').optional().isIn(Object.values(Role))
      .withMessage('Invalid role specified. Valid roles are: ' + Object.values(Role).join(', ')),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
    // Password changes are not handled by this endpoint for admins
  ],
  asyncHandler(adminController.updateUserHandler)
);

/**
 * @openapi
 * /admin/users/{userId}:
 *   delete:
 *     tags: [Admin - Users]
 *     summary: Delete a user
 *     description: Deletes a specific user by their ID. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the user to delete.
 *     responses:
 *       '200':
 *         description: User deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse' # Or specific deletion confirmation
 *       '400':
 *         description: Invalid User ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.delete(
  '/users/:userId',
  validateUserIdParam,
  asyncHandler(adminController.deleteUserHandler)
);


// Section: Existing routes for creating users and profiles
// (These are kept as they are, but now clearly separated)

/**
 * @openapi
 * /admin/users:
 *   post:
 *     tags: [Admin - Users]
 *     summary: Create a new user
 *     description: Creates a new user with specified details and role. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserCreateRequest'
 *     responses:
 *       '201':
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User' # Returns the created user
 *       '400':
 *         description: Validation error (e.g., email already exists, invalid role).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '500':
 *         description: Internal server error.
 */
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

/**
 * @openapi
 * /admin/directors:
 *   post:
 *     tags: [Admin - Directors]
 *     summary: Create a director profile
 *     description: Creates a director profile for an existing user. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminDirectorCreateRequest'
 *     responses:
 *       '201':
 *         description: Director profile created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DirectorProfile'
 *       '400':
 *         description: Validation error (e.g., user not found, user already a director).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: User specified by userId not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.post(
  '/directors',
  [
    body('userId').matches(CUID_REGEX).withMessage('User ID must be a valid CUID format.'),
    body('department').notEmpty().withMessage('Department is required.').trim().escape(),
    body('officeLocation').notEmpty().withMessage('Office location is required.').trim().escape(),
  ],
  asyncHandler(adminController.createDirector)
);

/**
 * @openapi
 * /admin/assistants:
 *   post:
 *     tags: [Admin - Assistants]
 *     summary: Create an assistant profile
 *     description: Creates an assistant profile for an existing user and links them to a director. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminAssistantCreateRequest'
 *     responses:
 *       '201':
 *         description: Assistant profile created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssistantProfile'
 *       '400':
 *         description: Validation error (e.g., user or director not found, user already an assistant).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: User or Director specified by ID not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.post(
  '/assistants',
  [
    body('userId').matches(CUID_REGEX).withMessage('User ID must be a valid CUID format.'),
    body('directorId').matches(CUID_REGEX).withMessage('Director ID for linking must be a valid CUID format.'),
  ],
  asyncHandler(adminController.createAssistant)
);

// Section: Director Profile Management by Admin

/**
 * @openapi
 * /admin/directors:
 *   get:
 *     tags: [Admin - Directors]
 *     summary: List all director profiles
 *     description: Retrieves a list of all director profiles. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of director profiles.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DirectorProfile'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '500':
 *         description: Internal server error.
 */
router.get(
  '/directors',
  asyncHandler(adminController.listDirectorsHandler)
);

/**
 * @openapi
 * /admin/directors/{directorId}:
 *   get:
 *     tags: [Admin - Directors]
 *     summary: Get a specific director profile by ID
 *     description: Retrieves details of a specific director profile by its ID. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: directorId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the director profile to retrieve.
 *     responses:
 *       '200':
 *         description: Director profile details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DirectorProfile'
 *       '400':
 *         description: Invalid Director ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Director profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.get(
  '/directors/:directorId',
  validateDirectorIdParam,
  asyncHandler(adminController.getDirectorByIdHandler)
);

/**
 * @openapi
 * /admin/directors/{directorId}:
 *   put:
 *     tags: [Admin - Directors]
 *     summary: Update a director's profile
 *     description: Updates a director's department or office location. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: directorId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the director profile to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminDirectorUpdateRequest'
 *     responses:
 *       '200':
 *         description: Director profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DirectorProfile' # Returns the updated director profile
 *       '400':
 *         description: Validation error or invalid Director ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Director profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.put(
  '/directors/:directorId',
  [
    ...validateDirectorIdParam,
    body('department').optional().isString().notEmpty().withMessage('Department must be a non-empty string.').trim().escape(),
    body('officeLocation').optional().isString().notEmpty().withMessage('Office location must be a non-empty string.').trim().escape(),
  ],
  asyncHandler(adminController.updateDirectorHandler)
);

/**
 * @openapi
 * /admin/directors/{directorId}:
 *   delete:
 *     tags: [Admin - Directors]
 *     summary: Delete a director profile
 *     description: Deletes a specific director profile by its ID. User associated with director is not deleted. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: directorId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the director profile to delete.
 *     responses:
 *       '200':
 *         description: Director profile deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       '400':
 *         description: Invalid Director ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Director profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.delete(
  '/directors/:directorId',
  validateDirectorIdParam,
  asyncHandler(adminController.deleteDirectorHandler)
);

// Section: Assistant Profile Management by Admin

/**
 * @openapi
 * /admin/assistants:
 *   get:
 *     tags: [Admin - Assistants]
 *     summary: List all assistant profiles
 *     description: Retrieves a list of all assistant profiles. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of assistant profiles.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AssistantProfile'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '500':
 *         description: Internal server error.
 */
router.get(
  '/assistants',
  asyncHandler(adminController.listAssistantsHandler)
);

/**
 * @openapi
 * /admin/assistants/{assistantId}:
 *   get:
 *     tags: [Admin - Assistants]
 *     summary: Get a specific assistant profile by ID
 *     description: Retrieves details of a specific assistant profile by its ID. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the assistant profile to retrieve.
 *     responses:
 *       '200':
 *         description: Assistant profile details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssistantProfile'
 *       '400':
 *         description: Invalid Assistant ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Assistant profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.get(
  '/assistants/:assistantId',
  validateAssistantIdParam,
  asyncHandler(adminController.getAssistantByIdHandler)
);

/**
 * @openapi
 * /admin/assistants/{assistantId}:
 *   put:
 *     tags: [Admin - Assistants]
 *     summary: Update an assistant's profile
 *     description: Updates an assistant's linked director. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the assistant profile to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminAssistantUpdateRequest'
 *     responses:
 *       '200':
 *         description: Assistant profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssistantProfile' # Returns the updated assistant profile
 *       '400':
 *         description: Validation error (e.g., new directorId invalid/not found) or invalid Assistant ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Assistant profile or new Director not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.put(
  '/assistants/:assistantId',
  [
    ...validateAssistantIdParam,
    body('directorId').optional().matches(CUID_REGEX).withMessage('New Director ID must be a valid CUID format if provided.'),
  ],
  asyncHandler(adminController.updateAssistantHandler)
);

/**
 * @openapi
 * /admin/assistants/{assistantId}:
 *   delete:
 *     tags: [Admin - Assistants]
 *     summary: Delete an assistant profile
 *     description: Deletes a specific assistant profile by its ID. User associated with assistant is not deleted. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the assistant profile to delete.
 *     responses:
 *       '200':
 *         description: Assistant profile deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       '400':
 *         description: Invalid Assistant ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Assistant profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.delete(
  '/assistants/:assistantId',
  validateAssistantIdParam,
  asyncHandler(adminController.deleteAssistantHandler)
);

export default router;
