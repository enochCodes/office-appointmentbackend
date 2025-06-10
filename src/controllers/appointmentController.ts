import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import appointmentService, { PublicAppointmentCreationData } from '../services/appointmentService';
import { Role } from '@prisma/client'; // For role checks
import prisma from '../prismaClient'; // For direct DB checks for authorization if needed

export const appointmentController = {
  async submitPublicAppointment(req: Request, res: Response) {
    // Implementation from previous step... (kept for context)
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { visitorName, email, phone, preferredDate, message, directorId } = req.body;
    try {
      const appointmentData: PublicAppointmentCreationData = {
        visitorName, email, phone: phone || null,
        preferredDate: new Date(preferredDate), message: message || null, directorId,
      };
      const newAppointment = await appointmentService.createPublicAppointment(appointmentData);
      return res.status(201).json({ message: 'Appointment request submitted.', appointment: newAppointment });
    } catch (error: any) {
      console.error('Error submitting appointment:', error.message);
      if (error.message.startsWith('Validation error:') || error.message.startsWith('Database error:')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to submit appointment.' });
    }
  },

  async getUnverifiedAppointments(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const directorId = req.params.director_id;
    const authenticatedUser = req.user!; // authenticateToken middleware ensures req.user exists

    try {
      // Authorization: User must be the director themselves or an assistant to that director
      if (authenticatedUser.role === Role.DIRECTOR && authenticatedUser.id !== directorId) {
        // A director can only see their own unverified appointments unless they are an admin (admin case handled by role middleware)
        // However, the route is for /:director_id, implying they are fetching for a specific director.
        // Let's assume a director can only be associated with their own user ID as directorId.
        // More complex scenarios (e.g. a director who is also an admin viewing another director's list) are out of scope here.
        // The crucial link is Director.userId.
        const directorProfile = await prisma.director.findUnique({ where: { id: directorId }});
        if (directorProfile?.userId !== authenticatedUser.id) {
             return res.status(403).json({ message: "Forbidden: Directors can only view their own unverified appointments." });
        }
      } else if (authenticatedUser.role === Role.ASSISTANT) {
        const assistant = await prisma.assistant.findUnique({ where: { userId: authenticatedUser.id }, include: { director: true } });
        if (!assistant || assistant.directorId !== directorId) {
          return res.status(403).json({ message: "Forbidden: Assistants can only view unverified appointments for their assigned director." });
        }
      }
      // Admins pass through due to authorizeRole([ADMIN, DIRECTOR, ASSISTANT]) - specific check not needed here for admin

      const appointments = await appointmentService.getUnverifiedAppointmentsForDirector(directorId);
      return res.status(200).json(appointments);
    } catch (error: any) {
      console.error(\`Error fetching unverified appointments for director \${directorId}:\`, error.message);
      return res.status(500).json({ message: 'Failed to fetch unverified appointments.' });
    }
  },

  async verifyAppointment(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const appointmentId = req.params.id;
    const authenticatedUser = req.user!;

    try {
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

      // Authorization: User must be the director of the appointment or an assistant to that director
      if (authenticatedUser.role === Role.DIRECTOR) {
         const directorProfile = await prisma.director.findUnique({ where: { id: appointment.directorId }});
         if (directorProfile?.userId !== authenticatedUser.id) {
            return res.status(403).json({ message: "Forbidden: Directors can only verify appointments for their own directorship." });
         }
      } else if (authenticatedUser.role === Role.ASSISTANT) {
        const assistant = await prisma.assistant.findUnique({ where: { userId: authenticatedUser.id } });
        if (!assistant || assistant.directorId !== appointment.directorId) {
          return res.status(403).json({ message: "Forbidden: Assistants can only verify appointments for their assigned director." });
        }
      }

      const updatedAppointment = await appointmentService.verifyAppointment(appointmentId, authenticatedUser.id);
      return res.status(200).json({ message: 'Appointment verified successfully.', appointment: updatedAppointment });
    } catch (error: any) {
      console.error(\`Error verifying appointment \${appointmentId}:\`, error.message);
      if (error.message.includes('not found') || error.message.includes('not pending')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to verify appointment.' });
    }
  },

  async rejectAppointment(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const appointmentId = req.params.id;
    const authenticatedUser = req.user!;

    try {
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

      // Authorization logic (similar to verifyAppointment)
      if (authenticatedUser.role === Role.DIRECTOR) {
        const directorProfile = await prisma.director.findUnique({ where: { id: appointment.directorId }});
        if (directorProfile?.userId !== authenticatedUser.id) {
            return res.status(403).json({ message: "Forbidden: Directors can only reject appointments for their own directorship." });
        }
      } else if (authenticatedUser.role === Role.ASSISTANT) {
        const assistant = await prisma.assistant.findUnique({ where: { userId: authenticatedUser.id } });
        if (!assistant || assistant.directorId !== appointment.directorId) {
          return res.status(403).json({ message: "Forbidden: Assistants can only reject appointments for their assigned director." });
        }
      }

      const updatedAppointment = await appointmentService.rejectAppointment(appointmentId, authenticatedUser.id);
      return res.status(200).json({ message: 'Appointment rejected successfully.', appointment: updatedAppointment });
    } catch (error: any) {
      console.error(\`Error rejecting appointment \${appointmentId}:\`, error.message);
       if (error.message.includes('not found') || error.message.includes('not pending')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to reject appointment.' });
    }
  },

  // This will be part of 'calendarController' or a similar specific controller
  // but the logic is here for now.
  async getCalendar(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const directorId = req.params.director_id; // director's actual ID, not user ID
    const authenticatedUser = req.user!;

    try {
      // Authorization: User must be the director themselves or an assistant to that director
      if (authenticatedUser.role === Role.DIRECTOR) {
        const directorProfile = await prisma.director.findUnique({ where: { id: directorId }});
        if (directorProfile?.userId !== authenticatedUser.id) {
             return res.status(403).json({ message: "Forbidden: Directors can only view their own calendar." });
        }
      } else if (authenticatedUser.role === Role.ASSISTANT) {
        const assistant = await prisma.assistant.findUnique({ where: { userId: authenticatedUser.id } });
        if (!assistant || assistant.directorId !== directorId) {
          return res.status(403).json({ message: "Forbidden: Assistants can only view the calendar of their assigned director." });
        }
      }
      // Admins can also access if Role.ADMIN is included in authorizeRole for this route

      const appointments = await appointmentService.getCalendarForDirector(directorId);
      return res.status(200).json(appointments);
    } catch (error: any) {
      console.error(\`Error fetching calendar for director \${directorId}:\`, error.message);
      return res.status(500).json({ message: 'Failed to fetch calendar.' });
    }
  }
};

export default appointmentController;
