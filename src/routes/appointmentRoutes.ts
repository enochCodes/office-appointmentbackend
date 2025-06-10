import { Router } from 'express';
import { body, param } from 'express-validator';
import appointmentController from '../controllers/appointmentController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// POST /api/appointments - Public endpoint
router.post(
  '/',
  [
    body('visitorName').notEmpty().withMessage('Visitor name is required.').trim().escape(),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Valid phone number required.').trim().escape(),
    body('preferredDate').isISO8601({ strict: true, strictSeparator: true }).withMessage('Preferred date must be valid ISO8601 (YYYY-MM-DDTHH:mm:ss.sssZ).').toDate()
      .custom((value: Date) => { if (value.getTime() <= Date.now()) throw new Error('Preferred date must be in the future.'); return true; }),
    body('message').optional({ checkFalsy: true }).isString().trim().escape(),
    body('directorId').notEmpty().withMessage('Director ID is required.').isCUID().withMessage('Director ID must be a valid CUID.'),
  ],
  appointmentController.submitPublicAppointment
);

// POST /api/appointments/cancel/:token - Publicly accessible cancellation route
router.post(
  '/cancel/:token',
  [
    param('token').isHexadecimal().withMessage('Token must be a hexadecimal string.')
                 .isLength({ min: 64, max: 64 }).withMessage('Token must be 64 characters long (32 bytes hex).'),
  ],
  appointmentController.handlePublicAppointmentCancellation
);


// --- Authenticated Routes ---
router.get(
  '/unverified/:director_id',
  authenticateToken, authorizeRole([Role.ADMIN, Role.DIRECTOR, Role.ASSISTANT]),
  [param('director_id').isCUID().withMessage('Director ID parameter must be a valid CUID.')],
  appointmentController.getUnverifiedAppointments
);
router.put(
  '/:id/verify',
  authenticateToken, authorizeRole([Role.ADMIN, Role.DIRECTOR, Role.ASSISTANT]),
  [param('id').isCUID().withMessage('Appointment ID parameter must be a valid CUID.')],
  appointmentController.verifyAppointment
);
router.put(
  '/:id/reject',
  authenticateToken, authorizeRole([Role.ADMIN, Role.DIRECTOR, Role.ASSISTANT]),
  [param('id').isCUID().withMessage('Appointment ID parameter must be a valid CUID.')],
  appointmentController.rejectAppointment
);

export default router;
