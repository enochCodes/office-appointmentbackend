import prisma from '../prismaClient';
import { Director, Assistant, User, Role, Prisma } from '@prisma/client'; // Added Prisma for error types

export type DirectorProfileData = {
  department: string;
  officeLocation: string;
};

// AssistantProfileData is not strictly needed if no extra fields, but good for consistency
export type AssistantProfileData = {
  // Example: specific permissions or notes for the assistant
  // notes?: string;
};

export const adminService = {
  async createDirectorProfile(userId: string, data: DirectorProfileData): Promise<Director> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`Validation Error: User with ID '${userId}' not found.`);
    }
    if (user.role !== Role.DIRECTOR) {
      throw new Error(`Validation Error: User with ID '${userId}' does not have the DIRECTOR role. Current role: '${user.role}'.`);
    }

    const existingDirector = await prisma.director.findUnique({ where: { userId } });
    if (existingDirector) {
        throw new Error(`Conflict Error: Director profile already exists for user ID '${userId}'.`);
    }

    try {
      return await prisma.director.create({
        data: {
          userId,
          department: data.department,
          officeLocation: data.officeLocation,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        // Should be caught by the check above, but as a safeguard
        throw new Error(`Conflict Error: A director profile linked to this user might already exist (P2002).`);
      }
      console.error("Error in createDirectorProfile:", e);
      throw new Error('Server Error: Could not create director profile.');
    }
    // fallback return to satisfy TS, though all code paths above throw or return
    throw new Error('Unknown error in createDirectorProfile.');
  },

  async createAssistantProfile(userId: string, directorId: string, _data?: AssistantProfileData): Promise<Assistant> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`Validation Error: User with ID '${userId}' not found.`);
    }
    if (user.role !== Role.ASSISTANT) {
      throw new Error(`Validation Error: User with ID '${userId}' does not have the ASSISTANT role. Current role: '${user.role}'.`);
    }

    const director = await prisma.director.findUnique({ where: { id: directorId } });
    if (!director) {
      throw new Error(`Validation Error: Director with ID '${directorId}' not found to link assistant.`);
    }

    const existingAssistant = await prisma.assistant.findUnique({ where: { userId } });
    if (existingAssistant) {
        throw new Error(`Conflict Error: Assistant profile already exists for user ID '${userId}'.`);
    }

    try {
      return await prisma.assistant.create({
        data: {
          userId,
          directorId,
          // ...data, // Spread if AssistantProfileData has properties
        },
      });
    } catch (e) {
       if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') { // Unique constraint failed (likely on userId if schema enforces 1-to-1 User-Assistant)
            throw new Error(`Conflict Error: An assistant profile for user ID '${userId}' may already exist (P2002).`);
        } else if (e.code === 'P2003') { // Foreign key constraint failed (e.g. directorId invalid)
            throw new Error(`Validation Error: Director ID '${directorId}' is invalid or does not exist (P2003).`);
        }
      }
      console.error("Error in createAssistantProfile:", e);
      throw new Error('Server Error: Could not create assistant profile.');
    }
    // fallback return to satisfy TS, though all code paths above throw or return
    throw new Error('Unknown error in createAssistantProfile.');
  },
};

export default adminService;
