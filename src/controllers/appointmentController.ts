import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import appointmentService, { PublicAppointmentCreationData, PublicAppointmentCreationResponse } from '../services/appointmentService'; // Updated import
import { Role } from '@prisma/client';
import prisma from '../prismaClient';

export const appointmentController = {
  async submitPublicAppointment(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { visitorName, email, phone, preferredDate, message, directorId } = req.body;
    try {
      const appointmentData: PublicAppointmentCreationData = {
        visitorName, email, phone: phone || null,
        preferredDate: new Date(preferredDate), message: message || null, directorId,
      };
      // Capture the response that includes the cancellation token
      const creationResponse: PublicAppointmentCreationResponse = await appointmentService.createPublicAppointment(appointmentData);

      // The actual token (`creationResponse.cancellation_token_for_email`) would be used here to send an email.
      // For the API response, we might not want to return the raw token directly for security via logs, etc.
      // Let's return the appointment part and a message.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cancellation_token_for_email, ...appointmentDetails } = creationResponse;

      return res.status(201).json({
        message: 'Appointment request submitted successfully. A confirmation and cancellation link would typically be sent via email.',
        appointment: appointmentDetails,
      });
    } catch (error: any) {
      console.error('Error submitting appointment:', error.message);
      if (error.message.startsWith('Validation error:') || error.message.startsWith('Database error:')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to submit appointment.' });
    }
  },
  async getUnverifiedAppointments(req: Request, res: Response) { /* ... existing ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const directorId = req.params.director_id; const authenticatedUser = req.user!; try { if (authenticatedUser.role === Role.DIRECTOR) { const directorProfile = await prisma.director.findUnique({ where: { id: directorId }}); if (directorProfile?.userId !== authenticatedUser.id) { return res.status(403).json({ message: "Forbidden: Directors can only view their own unverified appointments." }); } } else if (authenticatedUser.role === Role.ASSISTANT) { const assistant = await prisma.assistant.findUnique({ where: { userId: authenticatedUser.id }, include: { director: true } }); if (!assistant || assistant.directorId !== directorId) { return res.status(403).json({ message: "Forbidden: Assistants can only view unverified appointments for their assigned director." }); } } const appointments = await appointmentService.getUnverifiedAppointmentsForDirector(directorId); return res.status(200).json(appointments); } catch (error: any) { console.error(\`Error fetching unverified appointments for director \${directorId}:\`, error.message); return res.status(500).json({ message: 'Failed to fetch unverified appointments.' }); } },
  async verifyAppointment(req: Request, res: Response) { /* ... existing ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const appointmentId = req.params.id; const authenticatedUser = req.user!; try { const appointment = await appointmentService.getAppointmentById(appointmentId); if (!appointment) return res.status(404).json({ message: 'Appointment not found.' }); if (authenticatedUser.role === Role.DIRECTOR) { const directorProfile = await prisma.director.findUnique({ where: { id: appointment.directorId }}); if (directorProfile?.userId !== authenticatedUser.id) { return res.status(403).json({ message: "Forbidden: Directors can only verify appointments for their own directorship." }); } } else if (authenticatedUser.role === Role.ASSISTANT) { const assistant = await prisma.assistant.findUnique({ where: { userId: authenticatedUser.id } }); if (!assistant || assistant.directorId !== appointment.directorId) { return res.status(403).json({ message: "Forbidden: Assistants can only verify appointments for their assigned director." }); } } const updatedAppointment = await appointmentService.verifyAppointment(appointmentId, authenticatedUser.id); return res.status(200).json({ message: 'Appointment verified successfully.', appointment: updatedAppointment }); } catch (error: any) { console.error(\`Error verifying appointment \${appointmentId}:\`, error.message); if (error.message.includes('not found') || error.message.includes('not pending')) { return res.status(400).json({ message: error.message }); } return res.status(500).json({ message: 'Failed to verify appointment.' }); } },
  async rejectAppointment(req: Request, res: Response) { /* ... existing ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const appointmentId = req.params.id; const authenticatedUser = req.user!; try { const appointment = await appointmentService.getAppointmentById(appointmentId); if (!appointment) return res.status(404).json({ message: 'Appointment not found.' }); if (authenticatedUser.role === Role.DIRECTOR) { const directorProfile = await prisma.director.findUnique({ where: { id: appointment.directorId }}); if (directorProfile?.userId !== authenticatedUser.id) { return res.status(403).json({ message: "Forbidden: Directors can only reject appointments for their own directorship." }); } } else if (authenticatedUser.role === Role.ASSISTANT) { const assistant = await prisma.assistant.findUnique({ where: { userId: authenticatedUser.id } }); if (!assistant || assistant.directorId !== appointment.directorId) { return res.status(403).json({ message: "Forbidden: Assistants can only reject appointments for their assigned director." }); } } const updatedAppointment = await appointmentService.rejectAppointment(appointmentId, authenticatedUser.id); return res.status(200).json({ message: 'Appointment rejected successfully.', appointment: updatedAppointment }); } catch (error: any) { console.error(\`Error rejecting appointment \${appointmentId}:\`, error.message); if (error.message.includes('not found') || error.message.includes('not pending')) { return res.status(400).json({ message: error.message }); } return res.status(500).json({ message: 'Failed to reject appointment.' }); } },
  async getCalendar(req: Request, res: Response) { /* ... existing ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const directorId = req.params.director_id; const authenticatedUser = req.user!; try { if (authenticatedUser.role === Role.DIRECTOR) { const directorProfile = await prisma.director.findUnique({ where: { id: directorId }}); if (directorProfile?.userId !== authenticatedUser.id) { return res.status(403).json({ message: "Forbidden: Directors can only view their own calendar." }); } } else if (authenticatedUser.role === Role.ASSISTANT) { const assistant = await prisma.assistant.findUnique({ where: { userId: authenticatedUser.id } }); if (!assistant || assistant.directorId !== directorId) { return res.status(403).json({ message: "Forbidden: Assistants can only view the calendar of their assigned director." }); } } const appointments = await appointmentService.getCalendarForDirector(directorId); return res.status(200).json(appointments); } catch (error: any) { console.error(\`Error fetching calendar for director \${directorId}:\`, error.message); return res.status(500).json({ message: 'Failed to fetch calendar.' }); } },

  async handlePublicAppointmentCancellation(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { token } = req.params;
    try {
      const cancelledAppointment = await appointmentService.cancelPublicAppointmentByToken(token);
      // Return minimal info, confirming cancellation
      return res.status(200).json({
        message: 'Your appointment has been cancelled successfully.',
        appointment: {
            id: cancelledAppointment.id,
            status: cancelledAppointment.status
        },
      });
    } catch (error: any) {
      console.error(\`Public appointment cancellation error for token \${token}:\`, error.message);
      if (error.message.startsWith('Validation Error:')) { // e.g., token not found
        return res.status(404).json({ message: error.message });
      }
      if (error.message.startsWith('Conflict Error:')) { // e.g., appointment not in cancellable state
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to process appointment cancellation.' });
    }
  }
};
export default appointmentController;
