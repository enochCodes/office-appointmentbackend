import { appointmentService } from './appointmentService';
import prisma from '../prismaClient';
import { AppointmentStatus, Role, Appointment, User, Director } from '@prisma/client';

// Mock Prisma Client
jest.mock('../prismaClient', () => ({
  director: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  appointment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
}));


describe('AppointmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUnverifiedAppointmentsForDirector', () => {
    const directorId = 'director-uuid-123';
    const mockDirector: Director = {
        id: directorId,
        userId: 'user-uuid-for-director',
        department: 'Test Department',
        officeLocation: 'Test Office'
    };

    it('should return pending appointments for a valid director', async () => {
      const mockAppointments: Appointment[] = [
        {
          id: 'appt-uuid-1', directorId, visitorName: 'Visitor 1', email: 'v1@example.com',
          preferredDate: new Date(), status: AppointmentStatus.PENDING,
          createdAt: new Date(), phone: null, message: null,
          submittedById: null, processedById: null,
        },
        {
          id: 'appt-uuid-2', directorId, visitorName: 'Visitor 2', email: 'v2@example.com',
          preferredDate: new Date(), status: AppointmentStatus.PENDING,
          createdAt: new Date(), phone: null, message: null,
          submittedById: null, processedById: null,
        },
      ];

      (prisma.director.findUnique as jest.Mock).mockResolvedValue(mockDirector);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getUnverifiedAppointmentsForDirector(directorId);

      expect(prisma.director.findUnique).toHaveBeenCalledWith({ where: { id: directorId } });
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          directorId: directorId,
          status: AppointmentStatus.PENDING,
        },
        include: {
          submittedBy: true,
        },
        orderBy: {
          preferredDate: 'asc',
        },
      });
      expect(result).toEqual(mockAppointments);
      expect(result.length).toBe(2);
    });

    it('should return an empty array if no pending appointments exist', async () => {
      (prisma.director.findUnique as jest.Mock).mockResolvedValue(mockDirector);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await appointmentService.getUnverifiedAppointmentsForDirector(directorId);
      expect(result).toEqual([]);
    });

    it('should throw an error if the director ID is invalid or director not found', async () => {
      (prisma.director.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(appointmentService.getUnverifiedAppointmentsForDirector(directorId))
        .rejects
        .toThrowError(`Validation error: Director with ID '${directorId}' not found.`);
    });

    it('should throw a generic error if findMany fails for other reasons', async () => {
        (prisma.director.findUnique as jest.Mock).mockResolvedValue(mockDirector);
        (prisma.appointment.findMany as jest.Mock).mockRejectedValue(new Error('Database connection error'));
        await expect(appointmentService.getUnverifiedAppointmentsForDirector(directorId))
            .rejects
            .toThrowError('Failed to retrieve unverified appointments due to a server error.');
    });
  });

  describe('verifyAppointment', () => {
    const appointmentId = 'appt-uuid-verify';
    const verifierUserId = 'user-assistant-uuid';
    const mockVerifier: User = {
        id: verifierUserId, name: 'Assistant User', email: 'assistant@example.com',
        role: Role.ASSISTANT, password: 'hashedpassword', createdAt: new Date(), phone: null,
    };
    const mockPendingAppointment: Appointment = {
      id: appointmentId, directorId: 'director-uuid-456', visitorName: 'Visitor Verify',
      email: 'vv@example.com', preferredDate: new Date(), status: AppointmentStatus.PENDING,
      createdAt: new Date(), phone: null, message: null,
      submittedById: null, processedById: null,
    };

    it('should successfully verify a PENDING appointment for an ASSISTANT role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockVerifier);
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockPendingAppointment);
      const expectedUpdatedAppointment = {
        ...mockPendingAppointment,
        status: AppointmentStatus.VERIFIED,
        processedById: verifierUserId
      };
      (prisma.appointment.update as jest.Mock).mockResolvedValue(expectedUpdatedAppointment);

      const result = await appointmentService.verifyAppointment(appointmentId, verifierUserId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: verifierUserId } });
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({ where: { id: appointmentId } });
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.VERIFIED,
          processedById: verifierUserId,
          // processedAt: expect.any(Date), // Removed as service no longer sets it
        },
      });
      expect(result.status).toBe(AppointmentStatus.VERIFIED);
      expect(result.processedById).toBe(verifierUserId);
      expect(result).not.toHaveProperty('processedAt');
    });

    it('should successfully verify a PENDING appointment for a DIRECTOR role', async () => {
      const directorVerifier: User = { ...mockVerifier, role: Role.DIRECTOR, id: 'director-user-uuid'};
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(directorVerifier);
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockPendingAppointment);
      const expectedUpdatedAppointment = { ...mockPendingAppointment, status: AppointmentStatus.VERIFIED, processedById: directorVerifier.id };
      (prisma.appointment.update as jest.Mock).mockResolvedValue(expectedUpdatedAppointment);

      const result = await appointmentService.verifyAppointment(appointmentId, directorVerifier.id);
      expect(result.status).toBe(AppointmentStatus.VERIFIED);
      expect(result.processedById).toBe(directorVerifier.id);
    });

    it('should throw error if verifier user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(appointmentService.verifyAppointment(appointmentId, 'non-existent-user'))
        .rejects
        .toThrowError(`User with ID 'non-existent-user' not found.`);
    });

    it('should throw error if user is not authorized (e.g., USER role)', async () => {
      const unauthorizedUser: User = { ...mockVerifier, role: Role.USER };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(unauthorizedUser);
      await expect(appointmentService.verifyAppointment(appointmentId, verifierUserId))
        .rejects
        .toThrowError(`User with role '${Role.USER}' is not authorized to verify appointments.`);
    });

    it('should throw error if appointment is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockVerifier);
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(appointmentService.verifyAppointment('non-existent-appt', verifierUserId))
        .rejects
        .toThrowError(`Appointment with ID 'non-existent-appt' not found.`);
    });

    it('should throw error if appointment is not in PENDING status (e.g., already VERIFIED)', async () => {
      const alreadyVerifiedAppointment: Appointment = { ...mockPendingAppointment, status: AppointmentStatus.VERIFIED };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockVerifier);
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(alreadyVerifiedAppointment);
      await expect(appointmentService.verifyAppointment(appointmentId, verifierUserId))
        .rejects
        .toThrowError(`Appointment with ID '${appointmentId}' cannot be verified because its current status is '${AppointmentStatus.VERIFIED}'. Only PENDING appointments can be verified.`);
    });

    it('should throw error if appointment is not in PENDING status (e.g., REJECTED)', async () => {
      const rejectedAppointment: Appointment = { ...mockPendingAppointment, status: AppointmentStatus.REJECTED };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockVerifier);
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(rejectedAppointment);
      await expect(appointmentService.verifyAppointment(appointmentId, verifierUserId))
        .rejects
        .toThrowError(`Appointment with ID '${appointmentId}' cannot be verified because its current status is '${AppointmentStatus.REJECTED}'. Only PENDING appointments can be verified.`);
    });
  });

  describe('rejectAppointment', () => {
    const appointmentId = 'appt-uuid-reject';
    const processorUserId = 'user-assistant-uuid-reject';
    const mockProcessor: User = {
        id: processorUserId, name: 'Assistant Rejector', email: 'assistant.rejector@example.com',
        role: Role.ASSISTANT, password: 'hashedpassword', createdAt: new Date(), phone: null,
    };
    const mockPendingAppointment: Appointment = {
      id: appointmentId, directorId: 'director-uuid-789', visitorName: 'Visitor Reject',
      email: 'vr@example.com', preferredDate: new Date(), status: AppointmentStatus.PENDING,
      createdAt: new Date(), phone: null, message: null,
      submittedById: null, processedById: null,
    };

    it('should successfully reject a PENDING appointment for an ASSISTANT role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProcessor);
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockPendingAppointment);
      const expectedUpdatedAppointment = { ...mockPendingAppointment, status: AppointmentStatus.REJECTED, processedById: processorUserId };
      (prisma.appointment.update as jest.Mock).mockResolvedValue(expectedUpdatedAppointment);

      const result = await appointmentService.rejectAppointment(appointmentId, processorUserId);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.REJECTED,
          processedById: processorUserId,
          // processedAt: expect.any(Date), // Removed as service no longer sets it
        },
      });
      expect(result.status).toBe(AppointmentStatus.REJECTED);
      expect(result.processedById).toBe(processorUserId);
      expect(result).not.toHaveProperty('processedAt');
    });

    it('should throw error if user is not authorized (e.g., USER role)', async () => {
      const unauthorizedUser: User = { ...mockProcessor, role: Role.USER };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(unauthorizedUser);
      await expect(appointmentService.rejectAppointment(appointmentId, processorUserId))
        .rejects
        .toThrowError(`User with role '${Role.USER}' is not authorized to reject appointments.`);
    });

    it('should throw error if appointment is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProcessor);
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(appointmentService.rejectAppointment('non-existent-appt-reject', processorUserId))
        .rejects
        .toThrowError(`Appointment with ID 'non-existent-appt-reject' not found.`);
    });

    it('should throw error if appointment is not in PENDING status (e.g., already VERIFIED)', async () => {
      const alreadyVerifiedAppointment: Appointment = { ...mockPendingAppointment, status: AppointmentStatus.VERIFIED };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProcessor);
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(alreadyVerifiedAppointment);
      await expect(appointmentService.rejectAppointment(appointmentId, processorUserId))
        .rejects
        .toThrowError(`Appointment with ID '${appointmentId}' cannot be rejected because its current status is '${AppointmentStatus.VERIFIED}'. Only PENDING appointments can be rejected.`);
    });
  });

  describe('getCalendarForDirector', () => {
    const directorId = 'director-uuid-cal';
    const mockDirector: Director = {
        id: directorId,
        userId: 'user-uuid-for-cal-director',
        department: 'Calendar Dept',
        officeLocation: 'Cal Office'
    };

    it('should return VERIFIED appointments for a valid director', async () => {
      const mockAppointments: Appointment[] = [
        {
          id: 'appt-uuid-cal-1', directorId, visitorName: 'Visitor Cal 1', email: 'vc1@example.com',
          preferredDate: new Date(), status: AppointmentStatus.VERIFIED,
          createdAt: new Date(), phone: null, message: null,
          submittedById: null, processedById: 'user-assistant-uuid',
        },
      ];
      (prisma.director.findUnique as jest.Mock).mockResolvedValue(mockDirector);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getCalendarForDirector(directorId);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          directorId: directorId,
          status: AppointmentStatus.VERIFIED,
        },
        include: {
          submittedBy: true,
        },
        orderBy: {
          preferredDate: 'asc',
        },
      });
      expect(result).toEqual(mockAppointments);
      expect(result[0].status).toBe(AppointmentStatus.VERIFIED);
    });

    it('should return an empty array if no VERIFIED appointments exist', async () => {
      (prisma.director.findUnique as jest.Mock).mockResolvedValue(mockDirector);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
      const result = await appointmentService.getCalendarForDirector(directorId);
      expect(result).toEqual([]);
    });

    it('should throw an error if the director ID is invalid or director not found', async () => {
      (prisma.director.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(appointmentService.getCalendarForDirector(directorId))
        .rejects
        .toThrowError(`Validation error: Director with ID '${directorId}' not found.`);
    });

     it('should throw a generic error if findMany fails for other reasons', async () => {
        (prisma.director.findUnique as jest.Mock).mockResolvedValue(mockDirector);
        (prisma.appointment.findMany as jest.Mock).mockRejectedValue(new Error('Some DB error'));
        await expect(appointmentService.getCalendarForDirector(directorId))
            .rejects
            .toThrowError('Failed to retrieve calendar due to a server error.');
    });
  });
});

// These helpers are not strictly necessary with the current test setup but can be useful
// if creating many varied instances of mocks.
// const createMockAppointment = (id: string, directorId: string, status: AppointmentStatus): Appointment => ({
//   id,
//   directorId,
//   visitorName: `Visitor for ${id}`,
//   email: `${id}@example.com`,
//   preferredDate: new Date(),
//   status,
//   createdAt: new Date(),
//   // No updatedAt, processedAt as per schema
//   phone: null,
//   message: null,
//   submittedById: null,
//   processedById: null,
// });

// const createMockUser = (id: string, role: Role): User => ({
//   id,
//   name: `User ${id}`,
//   email: `${id}@example.com`,
//   role,
//   password: 'testpassword', // Changed from passwordHash
//   createdAt: new Date(),
//   phone: null,
//   // No updatedAt as per schema
// });
