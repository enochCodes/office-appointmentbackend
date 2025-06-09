import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import authService from '../services/authService';
import { generateToken } from '../middleware/auth'; // generateToken from auth middleware
import { Role } from '@prisma/client'; // Import Role

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
  }
};
