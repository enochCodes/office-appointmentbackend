import { Router } from 'express';
import { param } from 'express-validator';
import appointmentController from '../controllers/appointmentController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/calendar/:director_id
router.get(
  '/:director_id',
  authenticateToken,
  authorizeRole([Role.ADMIN, Role.DIRECTOR, Role.ASSISTANT]),
  [param('director_id').isCUID().withMessage('Director ID parameter must be a valid CUID.')],
  appointmentController.getCalendar
);

export default router;
