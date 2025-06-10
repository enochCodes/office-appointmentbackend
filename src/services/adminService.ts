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

// For admin viewing user profiles (password omitted)
export type UserProfileAdminView = Omit<User, 'password'>;

// For admin updating user data. Password update is excluded.
export type UserUpdateAdminData = {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: Role;
};

export type UserListFilters = {
  role?: Role;
  // Future: pagination, search by name/email
};

// For admin updating director profiles
export type DirectorUpdateData = {
  department?: string;
  officeLocation?: string;
};

// For admin updating assistant profiles
export type AssistantUpdateData = {
  directorId?: string; // To reassign an assistant
  // Add other assistant-specific editable fields if any in AssistantProfileData
};


export const adminService = {
  // Omitting password from user results
  _omitPassword(user: User): UserProfileAdminView {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async listUsers(filters: UserListFilters): Promise<UserProfileAdminView[]> {
    const whereClause: Prisma.UserWhereInput = {};
    if (filters.role) {
      whereClause.role = filters.role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
    return users.map(this._omitPassword);
  },

  async getUserByIdAdmin(userId: string): Promise<UserProfileAdminView | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }
    return this._omitPassword(user);
  },

  async updateUserAsAdmin(
    adminUserId: string, // ID of the admin performing the action
    targetUserId: string,
    data: UserUpdateAdminData
  ): Promise<UserProfileAdminView> {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new Error(`Validation Error: User with ID '${targetUserId}' not found.`);
    }

    // Prevent changing role if target user is the last admin and new role is not ADMIN
    if (data.role && data.role !== Role.ADMIN && targetUser.role === Role.ADMIN) {
      if (targetUserId === adminUserId && data.role !== Role.ADMIN) {
         // This check is more about self-demotion if they are the only admin.
         // If adminUserId is different, it implies another admin is demoting this one.
      }
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        throw new Error('Operation Forbidden: Cannot change the role of the last administrator.');
      }
    }

    // Prevent admin from demoting themselves if they are the only admin left
    if (targetUserId === adminUserId && data.role && data.role !== Role.ADMIN && targetUser.role === Role.ADMIN) {
        const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
        if (adminCount <= 1) {
            throw new Error('Operation Forbidden: You cannot demote yourself as the last administrator.');
        }
    }


    // Prevent updating email to an already existing email of another user
    if (data.email && data.email !== targetUser.email) {
        const existingUserWithEmail = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUserWithEmail && existingUserWithEmail.id !== targetUserId) {
            throw new Error(`Conflict Error: Email '${data.email}' is already in use by another user.`);
        }
    }

    // Filter out password from data if accidentally passed
    const { ...updateDataSafe } = data;
    // if ('password' in updateDataSafe) delete updateDataSafe.password; // Should not be needed due to UserUpdateAdminData type

    try {
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: updateDataSafe,
      });
      return this._omitPassword(updatedUser);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && e.meta?.target === 'users_email_key') {
         throw new Error(`Conflict Error: Email '${data.email}' is already in use.`);
      }
      console.error(`Error updating user ${targetUserId} by admin ${adminUserId}:`, e);
      throw new Error('Server Error: Could not update user.');
    }
  },

  async deleteUserAsAdmin(adminUserId: string, targetUserId: string): Promise<UserProfileAdminView> {
    if (adminUserId === targetUserId) {
      throw new Error('Operation Forbidden: Administrators cannot delete their own accounts.');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new Error(`Validation Error: User with ID '${targetUserId}' not found.`);
    }

    if (targetUser.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        throw new Error('Operation Forbidden: Cannot delete the last administrator.');
      }
    }

    // Prisma schema handles cascading deletes for Director and Assistant profiles via `onDelete: Cascade`.
    // Appointments' submittedById and processedById are optional and will be handled by Prisma's default relation strategy.
    try {
      const deletedUser = await prisma.user.delete({ where: { id: targetUserId } });
      return this._omitPassword(deletedUser);
    } catch (e) {
        console.error(`Error deleting user ${targetUserId} by admin ${adminUserId}:`, e);
        // P2025: Record to delete does not exist. Already caught by findUnique above.
        // Other errors could be foreign key constraints if not handled by schema (less likely here).
        throw new Error('Server Error: Could not delete user.');
    }
  },

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

  // --- Director Profile Management ---
  async listDirectors(): Promise<Director[]> { // Consider adding pagination
    return prisma.director.findMany({
      include: {
        user: { // Include the associated user's public profile
          select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
        },
        // assistants: true, // Optionally include assistants linked to this director
      },
      orderBy: { user: { name: 'asc' } }
    });
  },

  async getDirectorByDirectorId(directorId: string): Promise<Director | null> {
    return prisma.director.findUnique({
      where: { id: directorId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
        },
      },
    });
  },

  async updateDirectorProfile(directorId: string, data: DirectorUpdateData): Promise<Director> {
    const director = await prisma.director.findUnique({ where: { id: directorId } });
    if (!director) {
      throw new Error(`Validation Error: Director profile with ID '${directorId}' not found.`);
    }
    if (Object.keys(data).length === 0) {
        throw new Error('Validation Error: No update data provided.');
    }
    try {
      return await prisma.director.update({
        where: { id: directorId },
        data,
      });
    } catch (e) {
        console.error(`Error updating director profile ${directorId}:`, e);
        throw new Error('Server Error: Could not update director profile.');
    }
  },

  async deleteDirectorProfile(directorId: string): Promise<Director> {
    const director = await prisma.director.findUnique({ where: { id: directorId } });
    if (!director) {
      throw new Error(`Validation Error: Director profile with ID '${directorId}' not found.`);
    }
    // Note: This only deletes the Director record. The User record and its role remain.
    // User role management should be handled via updateUserAsAdmin if demotion is needed.
    // Prisma schema's onDelete: Cascade on Assistant.directorId handles if director is deleted.
    // Appointments are not cascade deleted by default on director deletion based on current schema.
    try {
      return await prisma.director.delete({ where: { id: directorId } });
    } catch (e) {
        console.error(`Error deleting director profile ${directorId}:`, e);
        // P2025: Record to delete does not exist. Already caught by findUnique above.
        throw new Error('Server Error: Could not delete director profile.');
    }
  },

  // --- Assistant Profile Management ---
  async listAssistants(): Promise<Assistant[]> { // Consider pagination
    return prisma.assistant.findMany({
      include: {
        user: { // Assistant's user details
          select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
        },
        director: { // Director to whom the assistant is assigned
          include: {
            user: { // Director's user details
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
       orderBy: { user: { name: 'asc' } }
    });
  },

  async getAssistantByAssistantId(assistantId: string): Promise<Assistant | null> {
    return prisma.assistant.findUnique({
      where: { id: assistantId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
        },
        director: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  },

  async updateAssistantProfile(assistantId: string, data: AssistantUpdateData): Promise<Assistant> {
    const assistant = await prisma.assistant.findUnique({ where: { id: assistantId } });
    if (!assistant) {
      throw new Error(`Validation Error: Assistant profile with ID '${assistantId}' not found.`);
    }
     if (Object.keys(data).length === 0) {
        throw new Error('Validation Error: No update data provided.');
    }

    // If changing directorId, validate the new director exists
    if (data.directorId && data.directorId !== assistant.directorId) {
      const newDirector = await prisma.director.findUnique({ where: { id: data.directorId } });
      if (!newDirector) {
        throw new Error(`Validation Error: Director with ID '${data.directorId}' not found for reassigning assistant.`);
      }
    }

    try {
      return await prisma.assistant.update({
        where: { id: assistantId },
        data,
      });
    } catch (e) {
        console.error(`Error updating assistant profile ${assistantId}:`, e);
        // P2003 on directorId if it's invalid and not caught by above check in a race condition.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
             throw new Error(`Validation Error: New director ID is invalid or does not exist (P2003).`);
        }
        throw new Error('Server Error: Could not update assistant profile.');
    }
  },

  async deleteAssistantProfile(assistantId: string): Promise<Assistant> {
    const assistant = await prisma.assistant.findUnique({ where: { id: assistantId } });
    if (!assistant) {
      throw new Error(`Validation Error: Assistant profile with ID '${assistantId}' not found.`);
    }
    // Note: This only deletes the Assistant record. The User record and its role remain.
    try {
      return await prisma.assistant.delete({ where: { id: assistantId } });
    } catch (e) {
        console.error(`Error deleting assistant profile ${assistantId}:`, e);
        throw new Error('Server Error: Could not delete assistant profile.');
    }
  },
};

export default adminService;
