import prisma from '../prismaClient';
import { Appointment, AppointmentStatus, Prisma, Role, User } from '@prisma/client';

// Type for public appointment creation
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
      // The 'visitorName' and 'email' fields directly on the Appointment record
      // are the primary source for public submitter details.
      // 'submittedById' is not populated by createPublicAppointment, so including 'submittedBy'
      // would result in 'submittedBy: null'.
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
        processedBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });
  },

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
        where: { id: appointmentId }
    });
  }
};

export default appointmentService;
