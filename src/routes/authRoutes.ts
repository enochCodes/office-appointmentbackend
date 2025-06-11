import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth'; // For the /me route

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: User authentication and profile management
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Pa$$w0rd
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/User' # Assuming User schema is defined in swaggerConfig.ts
 *     UserProfileResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: clxkz21rb0000abcdef12345
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         name:
 *           type: string
 *           nullable: true
 *           example: John Doe
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, DIRECTOR, ASSISTANT]
 *           example: USER
 *         isActive:
 *           type: boolean
 *           example: true
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe
 *         phone:
 *           type: string
 *           example: "+0987654321"
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *           format: password
 *           example: currentPa$$w0rd
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: newStrongPa$$w0rd
 *     SuccessMessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Operation successful
 */

const router = Router();

// Helper to wrap async route handlers for Express compatibility
function asyncHandler(fn: any) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a user
 *     description: Authenticates a user and returns a JWT token along with user information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       '200':
 *         description: Successfully authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       '400':
 *         description: Validation error (e.g., invalid email format, password required).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Authentication failed (e.g., incorrect email or password).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     description: Retrieves the profile information of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved user profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       '401':
 *         description: Unauthorized (token missing or invalid).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(authController.getMe)
);

/**
 * @openapi
 * /auth/me:
 *   put:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     description: Updates the name and/or phone number of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       '200':
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse' # Returns the updated user profile
 *       '400':
 *         description: Validation error (e.g., invalid name or phone format, disallowed fields).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized (token missing or invalid).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /auth/me/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change current user password
 *     description: Allows the currently authenticated user to change their password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       '200':
 *         description: Password changed successfully.
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/SuccessMessageResponse'
 *       '400':
 *         description: Validation error (e.g., old password incorrect, new password too weak).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized (token missing or invalid, or old password incorrect).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
