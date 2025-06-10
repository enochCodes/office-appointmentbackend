import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { appointmentService, PublicAppointmentCreationData } from '../services/appointmentService';
// Assuming req.user will be populated by authentication middleware
// interface AuthenticatedRequest extends Request {
//   user?: {
//     id: string;
//     // other user properties like role can be added if needed by controller
//   };
// }

export const appointmentController = {
  /**
   * Handles submission of a new appointment by a public user.
   * Expected route: POST /api/appointments
   * Validation for body params (visitorName, email, preferredDate, directorId)
   * should be defined in the routes.
   */
  async submitPublicAppointment(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      visitorName,
      email,
      phone,
      preferredDate,
      message,
      directorId,
    } = req.body;

    try {
      const appointmentData: PublicAppointmentCreationData = {
        visitorName,
        email,
        phone: phone || null,
        preferredDate: new Date(preferredDate), // Ensure this is a valid date string
        message: message || null,
        directorId,
      };

      const newAppointment = await appointmentService.createPublicAppointment(appointmentData);
      return res.status(201).json({
        message: 'Appointment request submitted successfully. It is now pending verification.',
        appointment: newAppointment,
      });
    } catch (error: any) {
      console.error('Error in submitPublicAppointment:', error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.startsWith('Validation error:') || error.message.startsWith('Database error:')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'An unexpected error occurred while submitting the appointment.' });
    }
  },

  /**
   * Retrieves unverified appointments for a specific director.
   * Expected route: GET /api/appointments/unverified/:directorId
   * Validation for directorId (e.g., isUUID) should be defined in the routes.
   */
  async getUnverifiedAppointments(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { directorId } = req.params;

    try {
      const appointments = await appointmentService.getUnverifiedAppointmentsForDirector(directorId);
      return res.status(200).json(appointments);
    } catch (error: any) {
      console.error(`Error fetching unverified appointments for director ${directorId}:`, error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to retrieve unverified appointments.' });
    }
  },

  /**
   * Verifies an appointment.
   * Expected route: PUT /api/appointments/:appointmentId/verify
   * Requires authentication.
   * Validation for appointmentId (e.g., isUUID) should be defined in the routes.
   */
  async verifyAppointment(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // @ts-ignore
    const verifierUserId = req.user?.id;
    if (!verifierUserId) {
      return res.status(401).json({ message: 'Unauthorized. User not authenticated.' });
    }

    const { appointmentId } = req.params;

    try {
      const updatedAppointment = await appointmentService.verifyAppointment(appointmentId, verifierUserId);
      return res.status(200).json({
        message: 'Appointment verified successfully.',
        appointment: updatedAppointment,
      });
    } catch (error: any) {
      console.error(`Error verifying appointment ${appointmentId} by user ${verifierUserId}:`, error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('not authorized') || error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('cannot be verified') || error.message.includes('current status is')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to verify appointment.' });
    }
  },

  /**
   * Rejects an appointment.
   * Expected route: PUT /api/appointments/:appointmentId/reject
   * Requires authentication.
   * Validation for appointmentId (e.g., isUUID) should be defined in the routes.
   */
  async rejectAppointment(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // @ts-ignore
    const processorUserId = req.user?.id;
    if (!processorUserId) {
      return res.status(401).json({ message: 'Unauthorized. User not authenticated.' });
    }

    const { appointmentId } = req.params;

    try {
      const updatedAppointment = await appointmentService.rejectAppointment(appointmentId, processorUserId);
      return res.status(200).json({
        message: 'Appointment rejected successfully.',
        appointment: updatedAppointment,
      });
    } catch (error: any) {
      console.error(`Error rejecting appointment ${appointmentId} by user ${processorUserId}:`, error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('not authorized') || error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('cannot be rejected') || error.message.includes('current status is')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to reject appointment.' });
    }
  },

  /**
   * Retrieves the calendar (verified appointments) for a specific director.
   * Expected route: GET /api/calendar/:directorId
   * Validation for directorId (e.g., isUUID) should be defined in the routes.
   */
  async getCalendar(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { directorId } = req.params;

    try {
      const appointments = await appointmentService.getCalendarForDirector(directorId);
      return res.status(200).json(appointments);
    } catch (error: any) {
      console.error(`Error fetching calendar for director ${directorId}:`, error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to retrieve calendar.' });
    }
  }
};

export default appointmentController;
