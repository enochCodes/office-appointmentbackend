import prisma from '../prismaClient';
import bcrypt from 'bcrypt';
import { User, Role } from '@prisma/client'; // Prisma types

// More specific type for user creation, ensuring required fields for auth context
// Role is explicitly part of this type as it's fundamental for user identity in this system.
export type AuthUserCreationData = {
  name: string;
  email: string;
  phone?: string | null; // Prisma schema allows null for phone
  password: string;
  role: Role; // Role is required for creating any user
};

// Type for the user object returned by createUser, omitting password
export type UserProfile = Omit<User, 'password'>;

const SALT_ROUNDS = 10;

export const authService = {
  /**
   * Creates a new user with a hashed password.
   * @param userData - The data for the new user, including name, email, password, and role.
   * @returns The created user profile (excluding password).
   * @throws Error if email is already taken or password is not provided.
   */
  async createUser(userData: AuthUserCreationData): Promise<UserProfile> {
    const { email, password, ...otherData } = userData;

    if (!password) {
      throw new Error('Password is required for user creation.');
    }
    if (!email) {
      throw new Error('Email is required for user creation.');
    }
     if (!otherData.name) {
      throw new Error('Name is required for user creation.');
    }
    if (!otherData.role) {
      throw new Error('Role is required for user creation.');
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        ...otherData,
        email,
        password: hashedPassword,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Finds a user by their email address. Used for login process.
   * @param email - The email of the user to find.
   * @returns The full User object (including hashed password) if found, otherwise null.
   */
  async findUserByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Compares a plain text password with a hashed password.
   * @param plainPassword - The plain text password to check.
   * @param hashedPassword - The hashed password from the database.
   * @returns True if the passwords match, otherwise false.
   */
  async comparePassword(plainPassword: string, hashedPassword?: string): Promise<boolean> {
    if (!plainPassword || !hashedPassword) {
      return false; // Or throw an error if appropriate for your flow
    }
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Finds a user by their ID. Returns user profile without password.
   * @param id - The ID of the user to find.
   * @returns The user profile (excluding password) if found, otherwise null.
   */
  async findUserById(id: string): Promise<UserProfile | null> {
    if (!id) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  // Helper to omit password, consistent with adminService
  _omitPassword(user: User): UserProfile {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateUserProfile(userId: string, data: UserProfileUpdateData): Promise<UserProfile> {
    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found.'); // Or a more specific error type
    }

    // Prevent email or role updates through this method
    if ('email' in data || 'role' in data) {
      throw new Error('Email and role updates are not permitted through this profile update method.');
    }

    if (Object.keys(data).length === 0) {
        throw new Error('No update data provided.');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
      },
    });
    return this._omitPassword(updatedUser);
  },

  async changePassword(userId: string, oldPasswordAttempt: string, newPasswordPlain: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      // User not found or password not set (shouldn't happen for existing users)
      throw new Error('User not found or account improperly configured.');
    }

    const isOldPasswordCorrect = await bcrypt.compare(oldPasswordAttempt, user.password);
    if (!isOldPasswordCorrect) {
      throw new Error('Incorrect old password.');
    }

    if (!newPasswordPlain || newPasswordPlain.length < 8) {
        // Basic validation, can be enhanced with complexity rules
        throw new Error('New password must be at least 8 characters long.');
    }

    if (oldPasswordAttempt === newPasswordPlain) {
        throw new Error('New password cannot be the same as the old password.');
    }

    const newHashedPassword = await bcrypt.hash(newPasswordPlain, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });
    // No return value needed, or could return true/success message
  }
};

// For self-service profile updates by the user
export type UserProfileUpdateData = {
  name?: string;
  phone?: string | null;
  // Explicitly exclude email, role, password from this type for self-service updates
  email?: never;
  role?: never;
  password?: never;
};

export default authService;
