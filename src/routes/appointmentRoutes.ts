import { Router } from 'express';
import { body, param } from 'express-validator';
import appointmentController from '../controllers/appointmentController';
// import { authenticateToken, authorizeRole } from '../middleware/auth'; // To be used in Step 10
// import { Role } from '@prisma/client'; // To be used in Step 10

const router = Router();

// --- Public Route ---
// POST /api/appointments - Public endpoint to submit a new appointment
router.post(
  '/',
  [
    body('visitorName').notEmpty().withMessage('Visitor name is required.').trim().escape(),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Please provide a valid phone number.').trim().escape(),
    body('preferredDate')
      .isISO8601({ strict: true, strictSeparator: true })
      .withMessage('Preferred date must be a valid ISO 8601 date and time (YYYY-MM-DDTHH:mm:ss.sssZ).')
      .toDate() // Converts to JavaScript Date object
      .custom((value: Date) => { // Ensure date is in the future
        if (value.getTime() <= Date.now()) {
          throw new Error('Preferred date must be in the future.');
        }
        return true;
      }),
    body('message').optional({ checkFalsy: true }).isString().trim().escape(),
    body('directorId').notEmpty().withMessage('Director ID is required.').isString().trim()
    // Consider adding .isCUID() if your IDs are CUIDs and you want strict format validation
    // .isCUID().withMessage('Director ID must be a valid CUID.')
  ],
  appointmentController.submitPublicAppointment
);


// --- Authenticated Routes (Placeholders for Step 10) ---
// GET /api/appointments/unverified/:director_id
// router.get('/unverified/:director_id', authenticateToken, authorizeRole([Role.ASSISTANT, Role.DIRECTOR]), [param('director_id').isCUID()], appointmentController.getUnverifiedAppointments);

// PUT /api/appointments/:id/verify
// router.put('/:id/verify', authenticateToken, authorizeRole([Role.ASSISTANT, Role.DIRECTOR]), [param('id').isCUID()], appointmentController.verifyAppointment);

// PUT /api/appointments/:id/reject
// router.put('/:id/reject', authenticateToken, authorizeRole([Role.ASSISTANT, Role.DIRECTOR]), [param('id').isCUID()], appointmentController.rejectAppointment);

// GET /api/calendar/:director_id (Note: different base path as per spec)
// This might be better in a separate calendarRoutes.ts or handled by prefixing in app.ts
// For now, keeping it here commented out.
// router.get('/calendar/:director_id', authenticateToken, authorizeRole([Role.DIRECTOR, Role.ASSISTANT]), [param('director_id').isCUID()], appointmentController.getCalendar);


export default router;
