import { Router } from 'express';
import { body, query, param } from 'express-validator';
import adminController from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { Role, AppointmentStatus } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([Role.ADMIN]));

// User Management
router.post('/users', [
    body('name').notEmpty().withMessage('Name is required.').trim().escape(),
    body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Valid phone number required if provided.').trim().escape(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('role').isIn(Object.values(Role)).withMessage('Invalid role specified. Valid roles are: ' + Object.values(Role).join(', ')),
], adminController.createUser);
router.get('/users', [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be an integer (1-100).'),
    query('role').optional().toUpperCase().isIn(Object.values(Role)).withMessage('Invalid role specified. Valid roles are: ' + Object.values(Role).join(', ')),
], adminController.listUsers);
router.get('/users/:id', [
    param('id').isCUID().withMessage('User ID parameter must be a valid CUID.')
], adminController.getUserById);
router.put('/users/:id/role', [
    param('id').isCUID().withMessage('User ID parameter must be a valid CUID.'),
    body('role').isIn(Object.values(Role)).withMessage('Invalid new role specified. Valid roles are: ' + Object.values(Role).join(', '))
], adminController.updateUserRole);

// Director Profile Management
router.post('/directors', [
    body('userId').notEmpty().isCUID().withMessage('User ID must be a valid CUID.'),
    body('department').notEmpty().withMessage('Department is required.').trim().escape(),
    body('officeLocation').notEmpty().withMessage('Office location is required.').trim().escape(),
], adminController.createDirector);
router.get('/directors', [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be an integer (1-100).'),
], adminController.listDirectorProfiles);

// Assistant Profile Management
router.post('/assistants', [
    body('userId').notEmpty().isCUID().withMessage('User ID must be a valid CUID.'),
    body('directorId').notEmpty().isCUID().withMessage('Director ID must be a valid CUID.'),
], adminController.createAssistant);
router.get('/assistants', [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be an integer (1-100).'),
], adminController.listAssistantProfiles);

// Appointment Management by Admin
router.get('/appointments', [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be an integer (1-100).'),
    query('status').optional().toUpperCase().isIn(Object.values(AppointmentStatus)).withMessage('Invalid status. Valid: ' + Object.values(AppointmentStatus).join(', ')),
    query('directorId').optional().isCUID().withMessage('Director ID must be a valid CUID.'),
], adminController.listAllAppointments);

router.put(
  '/appointments/:id',
  [
    param('id').isCUID().withMessage('Appointment ID must be a valid CUID.'),
    body('status').optional().toUpperCase().isIn(Object.values(AppointmentStatus))
      .withMessage('Invalid status. Valid: ' + Object.values(AppointmentStatus).join(', ')),
    // Ensure adminNotes can be explicitly set to null to clear them, or a string.
    // Allow empty string as well.
    body('adminNotes').optional({ nullable: true }).isString().trim().escape()
      .withMessage('Admin notes must be a string if provided.'),
    body().custom((value, { req }) => {
      if (typeof req.body.status === 'undefined' && typeof req.body.adminNotes === 'undefined') {
        throw new Error('At least one field (status or adminNotes) must be provided for update.');
      }
      return true;
    })
  ],
  adminController.adminUpdateAppointment
);

export default router;
