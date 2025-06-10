import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import appointmentController from '../controllers/appointmentController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

function asyncHandler(fn: any) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const CUID_REGEX = /^[a-z0-9]{25}$/;

const validateDirectorId = [
  param('directorId')
    .isString().withMessage('Director ID must be a string.')
    .matches(CUID_REGEX).withMessage('Director ID must be a valid CUID format (e.g., clxkz21rb0000abcdef12345).')
];

const validateAppointmentId = [
  param('appointmentId')
    .isString().withMessage('Appointment ID must be a string.')
    .matches(CUID_REGEX).withMessage('Appointment ID must be a valid CUID format (e.g., clxkz21rb0000abcdef12345).')
];

/**
 * @openapi
 * tags:
 *   name: Appointments
 *   description: Appointment management
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     AppointmentPublicResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Appointment request submitted successfully. It is now pending verification.
 *         appointment:
 *           $ref: '#/components/schemas/Appointment'
 *     AppointmentActionResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Appointment verified successfully.
 *         appointment:
 *           $ref: '#/components/schemas/Appointment'
 */

// --- Public Route ---
/**
 * @openapi
 * /appointments/public:
 *   post:
 *     tags: [Appointments]
 *     summary: Submit a new public appointment request
 *     description: Allows public users to submit an appointment request for a director.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublicAppointmentRequest'
 *     responses:
 *       '201':
 *         description: Appointment request submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentPublicResponse'
 *       '400':
 *         description: Validation error (e.g., invalid input, director not found).
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
  '/public',
  [
    body('visitorName').notEmpty().withMessage('Visitor name is required.').trim().escape(),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Please provide a valid phone number.').trim().escape(),
    body('preferredDate')
      .isISO8601({ strict: true, strictSeparator: true })
      .withMessage('Preferred date must be a valid ISO 8601 date and time (YYYY-MM-DDTHH:mm:ss.sssZ).')
      .toDate()
      .custom((value: Date) => {
        if (value.getTime() <= Date.now()) {
          throw new Error('Preferred date must be in the future.');
        }
        return true;
      }),
    body('message').optional({ checkFalsy: true }).isString().trim().escape(),
    body('directorId')
      .isString().withMessage('Director ID must be a string.')
      .matches(CUID_REGEX).withMessage('Director ID must be a valid CUID format (e.g., clxkz21rb0000abcdef12345).')
  ],
  asyncHandler(appointmentController.submitPublicAppointment)
);

// --- Authenticated Routes ---

/**
 * @openapi
 * /appointments/directors/{directorId}/appointments/unverified:
 *   get:
 *     tags: [Appointments]
 *     summary: Get unverified appointments for a director
 *     description: Retrieves all appointments with 'PENDING' status for a given director. Requires ASSISTANT or DIRECTOR role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: directorId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000abcdef12345
 *         description: The ID of the director.
 *     responses:
 *       '200':
 *         description: A list of unverified appointments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       '400':
 *         description: Validation error (e.g., invalid directorId format).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized (token missing or invalid).
 *       '403':
 *         description: Forbidden (user role not authorized).
 *       '404':
 *         description: Director not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 */
router.get(
  '/directors/:directorId/appointments/unverified',
  authenticateToken,
  authorizeRole([Role.ASSISTANT, Role.DIRECTOR]),
  validateDirectorId,
  asyncHandler(appointmentController.getUnverifiedAppointments)
);

/**
 * @openapi
 * /appointments/{appointmentId}/verify:
 *   post:
 *     tags: [Appointments]
 *     summary: Verify an appointment
 *     description: Updates the status of a PENDING appointment to VERIFIED. Requires ASSISTANT or DIRECTOR role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000abcdef12345
 *         description: The ID of the appointment to verify.
 *     responses:
 *       '200':
 *         description: Appointment verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentActionResponse'
 *       '400':
 *         description: Bad request (e.g., appointment not PENDING, invalid appointmentId format).
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Appointment or Verifier User not found.
 *       '500':
 *         description: Internal server error.
 */
router.post(
  '/:appointmentId/verify',
  authenticateToken,
  authorizeRole([Role.ASSISTANT, Role.DIRECTOR]),
  validateAppointmentId,
  asyncHandler(appointmentController.verifyAppointment)
);

/**
 * @openapi
 * /appointments/{appointmentId}/reject:
 *   post:
 *     tags: [Appointments]
 *     summary: Reject an appointment
 *     description: Updates the status of a PENDING appointment to REJECTED. Requires ASSISTANT or DIRECTOR role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000abcdef12345
 *         description: The ID of the appointment to reject.
 *     responses:
 *       '200':
 *         description: Appointment rejected successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentActionResponse'
 *       '400':
 *         description: Bad request (e.g., appointment not PENDING, invalid appointmentId format).
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Appointment or Processor User not found.
 *       '500':
 *         description: Internal server error.
 */
router.post(
  '/:appointmentId/reject',
  authenticateToken,
  authorizeRole([Role.ASSISTANT, Role.DIRECTOR]),
  validateAppointmentId,
  asyncHandler(appointmentController.rejectAppointment)
);

/**
 * @openapi
 * /appointments/directors/{directorId}/calendar:
 *   get:
 *     tags: [Appointments]
 *     summary: Get calendar for a director
 *     description: Retrieves all VERIFIED appointments for a given director. Requires ASSISTANT or DIRECTOR role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: directorId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *           example: clxkz21rb0000abcdef12345
 *         description: The ID of the director.
 *     responses:
 *       '200':
 *         description: A list of verified appointments (calendar).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       '400':
 *         description: Validation error (e.g., invalid directorId format).
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden.
 *       '404':
 *         description: Director not found.
 *       '500':
 *         description: Internal server error.
 */
router.get(
  '/directors/:directorId/calendar',
  authenticateToken,
  authorizeRole([Role.ASSISTANT, Role.DIRECTOR]),
  validateDirectorId,
  asyncHandler(appointmentController.getCalendar)
);

export default router;
