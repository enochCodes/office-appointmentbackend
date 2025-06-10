import prisma from '../prismaClient';
import { Appointment, AppointmentStatus, Prisma, Role, User } from '@prisma/client';
import crypto from 'crypto'; // Import crypto for token generation

// Type for public appointment creation
export type PublicAppointmentCreationData = {
  visitorName: string;
  email: string;
  phone?: string | null;
  preferredDate: Date;
  message?: string | null;
  directorId: string;
};

// Type for the response of createPublicAppointment, including the cancellation token
export type PublicAppointmentCreationResponse = Appointment & {
  cancellationLinkHint?: string; // Provide a hint rather than the full token directly in every response context if sensitive
                                // Or, for this specific return:
  cancellation_token_for_email?: string; // To make it clear this is for out-of-band sending
};


export const appointmentService = {
  async createPublicAppointment(data: PublicAppointmentCreationData): Promise<PublicAppointmentCreationResponse> {
    const director = await prisma.director.findUnique({ where: { id: data.directorId } });
    if (!director) {
      throw new Error(\`Validation error: Director with ID '\${data.directorId}' not found.\`);
    }

    const cancellationToken = crypto.randomBytes(32).toString('hex');

    try {
      const appointment = await prisma.appointment.create({
        data: {
          ...data,
          status: AppointmentStatus.PENDING,
          cancellation_token: cancellationToken, // Store the token
        },
      });
      // For the API response, we return the appointment and the token separately (or a hint)
      // The actual token might be emailed and not directly part of every Appointment object retrieved later.
      // So, we return it specifically on creation.
      return { ...appointment, cancellation_token_for_email: cancellationToken };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new Error(\`Database error: Invalid director ID '\${data.directorId}'.\`);
      }
      console.error("Error in createPublicAppointment:", e);
      throw new Error('Failed to create appointment due to a server error.');
    }
  },

  async getUnverifiedAppointmentsForDirector(directorId: string): Promise<Appointment[]> { /* ... existing ... */
    return prisma.appointment.findMany({ where: { directorId: directorId, status: AppointmentStatus.PENDING, }, orderBy: { preferredDate: 'asc', }});
  },
  async verifyAppointment(appointmentId: string, processorUserId: string): Promise<Appointment | null> { /* ... existing ... */
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }}); if (!appointment) { throw new Error(\`Appointment with ID '\${appointmentId}' not found.\`); } if (appointment.status !== AppointmentStatus.PENDING) { throw new Error(\`Appointment with ID '\${appointmentId}' is not pending and cannot be verified. Current status: \${appointment.status}.\`); } return prisma.appointment.update({ where: { id: appointmentId }, data: { status: AppointmentStatus.VERIFIED, processedById: processorUserId, }, });
  },
  async rejectAppointment(appointmentId: string, processorUserId: string): Promise<Appointment | null> { /* ... existing ... */
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }}); if (!appointment) { throw new Error(\`Appointment with ID '\${appointmentId}' not found.\`); } if (appointment.status !== AppointmentStatus.PENDING) { throw new Error(\`Appointment with ID '\${appointmentId}' is not pending and cannot be rejected. Current status: \${appointment.status}.\`); } return prisma.appointment.update({ where: { id: appointmentId }, data: { status: AppointmentStatus.REJECTED, processedById: processorUserId, }, });
  },
  async getCalendarForDirector(directorId: string): Promise<Appointment[]> { /* ... existing ... */
    return prisma.appointment.findMany({ where: { directorId: directorId, status: AppointmentStatus.VERIFIED, }, orderBy: { preferredDate: 'asc', }, include: { processedBy: { select: { id: true, name: true, role: true } } } });
  },
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> { /* ... existing ... */
    return prisma.appointment.findUnique({ where: { id: appointmentId } });
  },

  async cancelPublicAppointmentByToken(token: string): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { cancellation_token: token },
    });

    if (!appointment) {
      throw new Error('Validation Error: Invalid or expired cancellation token.');
    }

    if (appointment.status === AppointmentStatus.CANCELLED_BY_USER) {
      return appointment; // Idempotent: already cancelled by user
    }

    const cancellableStatuses: AppointmentStatus[] = [AppointmentStatus.PENDING, AppointmentStatus.VERIFIED];
    if (!cancellableStatuses.includes(appointment.status)) {
      throw new Error(\`Conflict Error: This appointment cannot be cancelled by the user at this stage. Current status: '\${appointment.status}'.\`);
    }

    return prisma.appointment.update({
      where: { id: appointment.id }, // Use primary key for update once found
      data: {
        status: AppointmentStatus.CANCELLED_BY_USER,
        // processedById: null, // Optional: clear processor if user cancels a verified appointment
      },
    });
  }
};
export default appointmentService;
