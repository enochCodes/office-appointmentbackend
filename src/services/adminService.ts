import prisma from '../prismaClient';
import { Director, Assistant, User, Role, Prisma } from '@prisma/client';

export type DirectorProfileData = { department: string; officeLocation: string; };
export type AssistantProfileData = {};
export type ListUsersOptions = { page?: number; limit?: number; role?: Role; };
export type UserProfileForList = Omit<User, 'password'> & {
  director?: { id: string; department: string | null } | null;
  assistant?: { id: string; directorId: string } | null;
};
export type PaginatedUsersResult = {
  users: UserProfileForList[]; total: number; page: number; limit: number; totalPages: number;
};
export type DetailedUserProfile = Omit<User, 'password'> & {
    director: (Director & {}) | null;
    assistant: (Assistant & { director: (Director & { user?: { name: string | null; email: string; } | null }) | null; }) | null;
};
export type DirectorProfileWithUser = Director & {
  user: { id: string; name: string; email: string; role: Role; createdAt: Date; } | null;
};
export type PaginatedDirectorProfilesResult = {
  directors: DirectorProfileWithUser[]; total: number; page: number; limit: number; totalPages: number;
};
export type AssistantProfileWithDetails = Assistant & {
  user: { id: string; name: string; email: string; role: Role; createdAt: Date } | null;
  director: (Director & { user: { id: string; name: string; email: string } | null }) | null;
};
export type PaginatedAssistantProfilesResult = {
  assistants: AssistantProfileWithDetails[]; total: number; page: number; limit: number; totalPages: number;
};

export type UserProfileBasic = Omit<User, 'password'>;


export const adminService = {
  // ... existing methods ...
  async createDirectorProfile(userId: string, data: DirectorProfileData): Promise<Director> { /* ... */
    const user = await prisma.user.findUnique({ where: { id: userId } }); if (!user) throw new Error(\`Validation Error: User with ID '\${userId}' not found.\`); if (user.role !== Role.DIRECTOR) throw new Error(\`Validation Error: User '\${userId}' not DIRECTOR.\`); const existingDirector = await prisma.director.findUnique({ where: { userId } }); if (existingDirector) throw new Error(\`Conflict Error: Director profile for user '\${userId}' already exists.\`); try { return await prisma.director.create({ data: { userId, ...data } }); } catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') { throw new Error(\`Conflict Error: Director profile linked to user '\${userId}' might already exist (P2002).\`); } console.error("Error in createDirectorProfile:", e); throw new Error('Server Error: Could not create director profile.'); }
  },
  async createAssistantProfile(userId: string, directorId: string, _data?: AssistantProfileData): Promise<Assistant> { /* ... */
    const user = await prisma.user.findUnique({ where: { id: userId } }); if (!user) throw new Error(\`Validation Error: User '\${userId}' not found.\`); if (user.role !== Role.ASSISTANT) throw new Error(\`Validation Error: User '\${userId}' not ASSISTANT.\`); const director = await prisma.director.findUnique({ where: { id: directorId } }); if (!director) throw new Error(\`Validation Error: Director '\${directorId}' not found.\`); const existingAssistant = await prisma.assistant.findUnique({ where: { userId } }); if (existingAssistant) throw new Error(\`Conflict Error: Assistant for user '\${userId}' already exists.\`); try { return await prisma.assistant.create({ data: { userId, directorId } }); } catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError) { if (e.code === 'P2002') throw new Error(\`Conflict Error: Assistant for user '\${userId}' may already exist (P2002).\`); if (e.code === 'P2003') throw new Error(\`Validation Error: Director ID '\${directorId}' invalid (P2003).\`);} console.error("Error in createAssistantProfile:", e); throw new Error('Server Error: Could not create assistant profile.');}
  },
  async listUsers(options: ListUsersOptions): Promise<PaginatedUsersResult> { /* ... */
    const page = options.page || 1; const limit = options.limit || 10; const skip = (page - 1) * limit; const whereClause: Prisma.UserWhereInput = {}; if (options.role) whereClause.role = options.role; const usersRaw = await prisma.user.findMany({ skip, take: limit, where: whereClause, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, director: { select: { id: true, department: true } }, assistant: { select: { id: true, directorId: true } } }, orderBy: { createdAt: 'desc' }, }); const users: UserProfileForList[] = usersRaw as UserProfileForList[]; const total = await prisma.user.count({ where: whereClause }); return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
  async getUserById(userId: string): Promise<DetailedUserProfile | null> { /* ... */
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, director: true, assistant: { include: { director: { include: { user: { select: { id: true, name: true, email: true } } } } } } }, }); if (!user) return null; return user as unknown as DetailedUserProfile;
  },
  async listDirectorProfiles(options: { page?: number; limit?: number }): Promise<PaginatedDirectorProfilesResult> { /* ... */
    const page = options.page || 1; const limit = options.limit || 10; const skip = (page - 1) * limit; const directorProfiles = await prisma.director.findMany({ skip, take: limit, include: { user: { select: { id: true, name: true, email: true, role: true, createdAt: true } } }, orderBy: { user: { name: 'asc' } }, }); const total = await prisma.director.count(); return { directors: directorProfiles as DirectorProfileWithUser[], total, page, limit, totalPages: Math.ceil(total / limit) };
  },
  async listAssistantProfiles(options: { page?: number; limit?: number }): Promise<PaginatedAssistantProfilesResult> { /* ... */
    const page = options.page || 1; const limit = options.limit || 10; const skip = (page - 1) * limit; const assistantProfiles = await prisma.assistant.findMany({ skip, take: limit, include: { user: { select: { id: true, name: true, email: true, role: true, createdAt: true } }, director: { include: { user: { select: { id: true, name: true, email: true } } } } }, orderBy: { user: { name: 'asc' } }, }); const total = await prisma.assistant.count(); return { assistants: assistantProfiles as AssistantProfileWithDetails[], total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateUserRole(userId: string, newRole: Role): Promise<UserProfileBasic> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { director: true, assistant: true },
    });

    if (!user) {
      throw new Error(\`Validation Error: User with ID '\${userId}' not found.\`);
    }

    if (user.role === newRole) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, director, assistant, ...userWithoutPasswordEtc } = user;
      return userWithoutPasswordEtc;
    }

    if (user.role === Role.DIRECTOR && user.director) {
      throw new Error(\`Conflict Error: User '\${userId}' has an active Director profile. Remove profile before changing role from DIRECTOR.\`);
    }
    if (user.role === Role.ASSISTANT && user.assistant) {
      throw new Error(\`Conflict Error: User '\${userId}' has an active Assistant profile. Remove profile before changing role from ASSISTANT.\`);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
    });
    return updatedUser;
  }
};
export default adminService;
