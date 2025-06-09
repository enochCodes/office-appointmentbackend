import prisma from '../prismaClient';
import { Appointment, AppointmentStatus, Prisma } from '@prisma/client';

// Type for public appointment creation
export type PublicAppointmentCreationData = {
  visitorName: string;
  email: string;
  phone?: string | null;
  preferredDate: Date; // Expecting a valid Date object
  message?: string | null;
  directorId: string;
  // status will be PENDING by default
  // createdById is for linking to a User record if a public user also has a light User account.
  // For this iteration, we assume anonymous submission or createdById handled separately if needed.
};

export const appointmentService = {
  /**
   * Creates a new appointment submitted by a public user.
   * @param data - Data for the new appointment.
   * @returns The created appointment.
   * @throws Error if the specified directorId does not exist.
   */
  async createPublicAppointment(data: PublicAppointmentCreationData): Promise<Appointment> {
    // Validate that the director exists
    const director = await prisma.director.findUnique({
      where: { id: data.directorId },
    });
    if (!director) {
      throw new Error(\`Validation error: Director with ID '\${data.directorId}' not found.\`);
    }

    try {
      const appointment = await prisma.appointment.create({
        data: {
          ...data,
          status: AppointmentStatus.PENDING, // Default status for new appointments
        },
      });
      return appointment;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors, e.g., foreign key constraint if directorId was invalid in a race condition
        if (e.code === 'P2003') { // Foreign key constraint failed
             throw new Error(\`Database error: Invalid director ID '\${data.directorId}'.\`);
        }
      }
      console.error("Error in createPublicAppointment:", e);
      throw new Error('Failed to create appointment due to a server error.');
    }
  },

  // --- Methods for Authenticated Users (to be implemented/expanded in Step 10) ---

  /**
   * Retrieves unverified (pending) appointments for a specific director.
   * To be used by Assistants or Directors.
   */
  async getUnverifiedAppointmentsForDirector(directorId: string): Promise<Appointment[]> {
    // Placeholder: Real implementation in Step 10
    console.log(\`Fetching unverified appointments for director: \${directorId}\`);
    return [];
  },

  /**
   * Verifies an appointment.
   * To be used by Assistants or Directors.
   */
  async verifyAppointment(appointmentId: string, verifierUserId: string): Promise<Appointment | null> {
    // Placeholder: Real implementation in Step 10
    console.log(\`Verifying appointment: \${appointmentId} by user: \${verifierUserId}\`);
    return null;
  },

  /**
   * Rejects an appointment.
   * To be used by Assistants or Directors.
   */
  async rejectAppointment(appointmentId: string, verifierUserId: string): Promise<Appointment | null> {
    // Placeholder: Real implementation in Step 10
    console.log(\`Rejecting appointment: \${appointmentId} by user: \${verifierUserId}\`);
    return null;
  },

  /**
   * Retrieves the calendar (verified appointments) for a specific director.
   * To be used by Directors or their Assistants.
   */
  async getCalendarForDirector(directorId: string): Promise<Appointment[]> {
    // Placeholder: Real implementation in Step 10
    console.log(\`Fetching calendar for director: \${directorId}\`);
    return [];
  },
};

export default appointmentService;
