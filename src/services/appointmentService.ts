import prisma from '../prismaClient';
import { Appointment, AppointmentStatus, Prisma, Role } from '@prisma/client'; // Changed UserRole to Role

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
      throw new Error(`Validation error: Director with ID '${data.directorId}' not found.`);
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
             throw new Error(`Database error: Invalid director ID '${data.directorId}'.`);
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
    // Validate that the director exists
    const director = await prisma.director.findUnique({
      where: { id: directorId },
    });
    if (!director) {
      throw new Error(`Validation error: Director with ID '${directorId}' not found.`);
    }

    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          directorId: directorId,
          status: AppointmentStatus.PENDING,
        },
        include: {
          submittedBy: true, // Include the user who submitted the appointment
        },
        orderBy: {
          preferredDate: 'asc', // Optional: order by preferred date
        }
      });
      return appointments;
    } catch (e) {
      // Log the error for server-side observability
      console.error(`Error fetching unverified appointments for director ${directorId}:`, e);
      // Rethrow a generic error to avoid exposing too many details to the client
      throw new Error('Failed to retrieve unverified appointments due to a server error.');
    }
  },

  /**
   * Verifies an appointment.
   * To be used by Assistants or Directors.
   */
  async verifyAppointment(appointmentId: string, verifierUserId: string): Promise<Appointment> {
    // 1. Fetch the user and check their role
    const verifier = await prisma.user.findUnique({
      where: { id: verifierUserId },
    });

    if (!verifier) {
      throw new Error(`User with ID '${verifierUserId}' not found.`);
    }

    if (verifier.role !== Role.ASSISTANT && verifier.role !== Role.DIRECTOR) { // Changed UserRole to Role
      throw new Error(`User with role '${verifier.role}' is not authorized to verify appointments.`);
    }

    // 2. Fetch the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error(`Appointment with ID '${appointmentId}' not found.`);
    }

    // 3. Check if the appointment is already verified or in a non-pending state
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new Error(
        `Appointment with ID '${appointmentId}' cannot be verified because its current status is '${appointment.status}'. Only PENDING appointments can be verified.`
      );
    }

    // 4. Update the appointment
    try {
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.VERIFIED,
          processedById: verifierUserId,
          // processedAt: new Date(), // Removed as not in schema
        },
      });
      return updatedAppointment;
    } catch (e) {
      // Log the error for server-side observability
      console.error(`Error verifying appointment ${appointmentId} by user ${verifierUserId}:`, e);
      // Rethrow a generic error or a more specific one if applicable
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // Example: Handle specific Prisma errors, though P2025 (record not found) should be caught by earlier checks.
        throw new Error('Failed to verify appointment due to a database error.');
      }
      throw new Error('Failed to verify appointment due to a server error.');
    }
  },

  /**
   * Rejects an appointment.
   * To be used by Assistants or Directors.
   */
  async rejectAppointment(appointmentId: string, processorUserId: string): Promise<Appointment> {
    // 1. Fetch the user and check their role
    const processor = await prisma.user.findUnique({
      where: { id: processorUserId },
    });

    if (!processor) {
      throw new Error(`User with ID '${processorUserId}' not found.`);
    }

    if (processor.role !== Role.ASSISTANT && processor.role !== Role.DIRECTOR) { // Changed UserRole to Role
      throw new Error(`User with role '${processor.role}' is not authorized to reject appointments.`);
    }

    // 2. Fetch the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error(`Appointment with ID '${appointmentId}' not found.`);
    }

    // 3. Check if the appointment is in PENDING status
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new Error(
        `Appointment with ID '${appointmentId}' cannot be rejected because its current status is '${appointment.status}'. Only PENDING appointments can be rejected.`
      );
    }

    // 4. Update the appointment
    try {
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.REJECTED,
          processedById: processorUserId,
          // processedAt: new Date(), // Removed as not in schema
        },
      });
      return updatedAppointment;
    } catch (e) {
      // Log the error for server-side observability
      console.error(`Error rejecting appointment ${appointmentId} by user ${processorUserId}:`, e);
      // Rethrow a generic error or a more specific one if applicable
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error('Failed to reject appointment due to a database error.');
      }
      throw new Error('Failed to reject appointment due to a server error.');
    }
  },

  /**
   * Retrieves the calendar (verified appointments) for a specific director.
   * To be used by Directors or their Assistants.
   */
  async getCalendarForDirector(directorId: string): Promise<Appointment[]> {
    // 1. Validate that the director exists
    const director = await prisma.director.findUnique({
      where: { id: directorId },
    });
    if (!director) {
      throw new Error(`Validation error: Director with ID '${directorId}' not found.`);
    }

    // 2. Fetch verified appointments for the director
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          directorId: directorId,
          status: AppointmentStatus.VERIFIED,
        },
        include: {
          submittedBy: true, // Include details of the user who submitted the appointment
          // processedBy: true, // Optionally, include details of the user who verified the appointment
        },
        orderBy: {
          preferredDate: 'asc', // Order by preferred date
        },
      });
      return appointments;
    } catch (e) {
      // Log the error for server-side observability
      console.error(`Error fetching calendar for director ${directorId}:`, e);
      // Rethrow a generic error to avoid exposing too many details to the client
      throw new Error('Failed to retrieve calendar due to a server error.');
    }
  },
};

export default appointmentService;
