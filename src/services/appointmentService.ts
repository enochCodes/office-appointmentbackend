import prisma from '../prismaClient';
import { Appointment, AppointmentStatus, Prisma, Role, User } from '@prisma/client';

// Type for public appointment creation (from previous step, kept for completeness)
export type PublicAppointmentCreationData = {
  visitorName: string;
  email: string;
  phone?: string | null;
  preferredDate: Date;
  message?: string | null;
  directorId: string;
};

export const appointmentService = {
  async createPublicAppointment(data: PublicAppointmentCreationData): Promise<Appointment> {
    const director = await prisma.director.findUnique({ where: { id: data.directorId } });
    if (!director) {
      throw new Error(\`Validation error: Director with ID '\${data.directorId}' not found.\`);
    }
    try {
      return await prisma.appointment.create({
        data: { ...data, status: AppointmentStatus.PENDING },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new Error(\`Database error: Invalid director ID '\${data.directorId}'.\`);
      }
      console.error("Error in createPublicAppointment:", e);
      throw new Error('Failed to create appointment due to a server error.');
    }
  },

  async getUnverifiedAppointmentsForDirector(directorId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: {
        directorId: directorId,
        status: AppointmentStatus.PENDING,
      },
      orderBy: {
        preferredDate: 'asc',
      },
      include: {
        // Include details of the public user who submitted the appointment
        submittedBy: {
          select: {
            id: true,
            name: true, // Assuming public users might not have a 'name' if not logged in.
                        // The schema has 'visitorName' on appointment directly.
                        // If 'submittedBy' refers to a registered user who submitted it, then 'name' is fine.
                        // Let's assume 'submittedBy' is not used for public forms, rather 'visitorName' is primary.
                        // If 'submittedBy' *is* used, then 'name' and 'email' from User table are relevant.
                        // Given the current schema, 'submittedById' can be null.
                        // For now, let's not include submittedBy here as public submissions might not have a linked user.
                        // The 'visitorName' and 'email' directly on the appointment are the primary identifiers for public submissions.
          }
        }
      }
    });
  },

  async verifyAppointment(appointmentId: string, processorUserId: string): Promise<Appointment | null> {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }});
    if (!appointment) {
        throw new Error(\`Appointment with ID '\${appointmentId}' not found.\`);
    }
    if (appointment.status !== AppointmentStatus.PENDING) {
        throw new Error(\`Appointment with ID '\${appointmentId}' is not pending and cannot be verified. Current status: \${appointment.status}.\`);
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.VERIFIED,
        processedById: processorUserId,
      },
    });
  },

  async rejectAppointment(appointmentId: string, processorUserId: string): Promise<Appointment | null> {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }});
    if (!appointment) {
        throw new Error(\`Appointment with ID '\${appointmentId}' not found.\`);
    }
    if (appointment.status !== AppointmentStatus.PENDING) {
        throw new Error(\`Appointment with ID '\${appointmentId}' is not pending and cannot be rejected. Current status: \${appointment.status}.\`);
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.REJECTED,
        processedById: processorUserId,
      },
    });
  },

  async getCalendarForDirector(directorId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: {
        directorId: directorId,
        status: AppointmentStatus.VERIFIED,
      },
      orderBy: {
        preferredDate: 'asc',
      },
      include: {
        // Include who processed (verified) the appointment
        processedBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
        // Not including 'submittedBy' for calendar view by default to keep it cleaner,
        // as 'visitorName' and 'visitorEmail' are primary. Can be added if needed.
      }
    });
  },

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
        where: { id: appointmentId }
        // Consider including director details if needed for auth checks frequently
        // include: { director: true }
    });
  }
};

export default appointmentService;
