import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import appointmentService, { PublicAppointmentCreationData } from '../services/appointmentService';
import { AppointmentStatus } from '@prisma/client'; // For later use

export const appointmentController = {
  /**
   * Handles submission of a new appointment by a public user.
   * POST /api/appointments
   */
  async submitPublicAppointment(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      visitorName,
      email,
      phone,
      preferredDate, // This is a string from JSON, converted to Date by express-validator's toDate()
      message,
      directorId,
    } = req.body;

    try {
      const appointmentData: PublicAppointmentCreationData = {
        visitorName,
        email,
        phone: phone || null, // Ensure null if empty string or undefined
        preferredDate: new Date(preferredDate), // express-validator's toDate() should handle this
        message: message || null, // Ensure null if empty string or undefined
        directorId,
      };

      const newAppointment = await appointmentService.createPublicAppointment(appointmentData);
      return res.status(201).json({
        message: 'Appointment request submitted successfully. It is now pending verification.',
        appointment: newAppointment,
      });
    } catch (error: any) {
      console.error('Error submitting appointment:', error.message);
      if (error.message.startsWith('Validation error:') || error.message.startsWith('Database error:')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'An unexpected error occurred while submitting the appointment.' });
    }
  },

  // --- Controller methods for Authenticated Users (to be implemented in Step 10) ---

  async getUnverifiedAppointments(req: Request, res: Response) {
    // Placeholder for GET /api/appointments/unverified/:director_id
    res.status(501).json({ message: 'Not Implemented Yet' });
  },

  async verifyAppointment(req: Request, res: Response) {
    // Placeholder for PUT /api/appointments/:id/verify
    res.status(501).json({ message: 'Not Implemented Yet' });
  },

  async rejectAppointment(req: Request, res: Response) {
    // Placeholder for PUT /api/appointments/:id/reject
    res.status(501).json({ message: 'Not Implemented Yet' });
  },

  async getCalendar(req: Request, res: Response) {
    // Placeholder for GET /api/calendar/:director_id
    res.status(501).json({ message: 'Not Implemented Yet' });
  }
};

export default appointmentController;
