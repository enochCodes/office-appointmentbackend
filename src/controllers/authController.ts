import { Request, Response, NextFunction } from 'express'; // Added NextFunction
import { validationResult } from 'express-validator';
import authService, { UserProfileUpdateData } from '../services/authService'; // Import UserProfileUpdateData
import { generateToken } from '../middleware/auth';
import { Role } from '@prisma/client';

export const authController = {
  async login(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await authService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials. User not found.' });
      }

      // Ensure user.password is not undefined before passing to comparePassword
      if (typeof user.password !== 'string') {
        // This case should ideally not happen if users are created correctly with passwords
        console.error(`User ${user.id} has no password set.`);
        return res.status(500).json({ message: 'Server error: User account improperly configured.' });
      }

      const isMatch = await authService.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
      }

      // Ensure user.id and user.role are valid before generating token
      if (!user.id || typeof user.role === 'undefined') {
         console.error(`User ${user.id} has missing id or role.`);
        return res.status(500).json({ message: 'Server error: User account data incomplete.' });
      }

      const token = generateToken(user.id, user.role as Role); // Cast role to Role if necessary, Prisma should ensure it

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userProfile } = user; // Exclude password from response

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: userProfile,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      // Check if it's a known error from our service, e.g., user not found, etc.
      // For now, a generic error message.
      return res.status(500).json({ message: error.message || 'Server error during login.' });
    }
  },

  async getMe(req: Request, res: Response) {
    // req.user is populated by authenticateToken middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authenticated or user ID missing.' });
    }

    try {
      const userProfile = await authService.findUserById(req.user.id);
      if (!userProfile) {
        // This implies the user ID in the token is no longer valid or user was deleted
        return res.status(404).json({ message: 'User profile not found.' });
      }
      return res.status(200).json(userProfile);
    } catch (error: any) {
      console.error('GetMe error:', error);
      return res.status(500).json({ message: error.message || 'Server error retrieving user profile.' });
    }
  },

  async updateMyProfileHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) {
      // Should be caught by authenticateToken middleware, but good for safety
      return res.status(401).json({ message: 'Unauthorized: User ID not found in token.' });
    }

    const { name, phone } = req.body;
    const updateData: UserProfileUpdateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone; // handles null or string

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No update data provided (accepted fields: name, phone).' });
    }

    // Explicitly disallow email/role/password updates via this endpoint in controller too
    if (req.body.email || req.body.role || req.body.password){
        return res.status(400).json({ message: 'Email, role, or password updates are not allowed via this endpoint.' });
    }

    try {
      const updatedUserProfile = await authService.updateUserProfile(userId, updateData);
      res.status(200).json({ message: 'Profile updated successfully.', user: updatedUserProfile });
    } catch (error: any) {
      console.error(`UpdateMyProfile error for user ${userId}:`, error.message);
      if (error.message === 'User not found.') { // Specific error from service
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'No update data provided.') { // Specific error from service
        return res.status(400).json({ message: error.message });
      }
      // For other errors from service like "Email and role updates are not permitted..."
      if (error.message.includes("not permitted")) {
          return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to update profile due to a server error.' });
    }
  },

  async changeMyPasswordHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID not found in token.' });
    }

    const { oldPassword, newPassword } = req.body;

    try {
      await authService.changePassword(userId, oldPassword, newPassword);
      res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error: any) {
      console.error(`ChangeMyPassword error for user ${userId}:`, error.message);
      if (error.message === 'User not found or account improperly configured.') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Incorrect old password.') {
        return res.status(400).json({ message: error.message }); // Or 401/403 for security
      }
      if (error.message === 'New password must be at least 8 characters long.' || error.message === 'New password cannot be the same as the old password.') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to change password due to a server error.' });
    }
  }
};
