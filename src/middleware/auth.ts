import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client'; // Prisma Role enum
// import authService from '../services/authService'; // Keep this commented unless DB check per request is enabled

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in the environment variables.");
  // In a real app, you might want to prevent the app from starting or running in a broken state.
  // For this environment, we'll log and proceed, but routes requiring JWT will fail.
  // process.exit(1);
}

// Extend Express Request type to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        // Add other frequently accessed user properties if necessary
      };
    }
  }
}

/**
 * Generates a JWT for a given user ID and role.
 * @param userId The ID of the user.
 * @param role The role of the user.
 * @returns The generated JWT string.
 */
export const generateToken = (userId: string, role: Role): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not available to sign the token.");
  }
  // Standard payload: id and role. Add 'iat' (issued at) by default.
  // 'exp' (expiration time) is also standard.
  return jwt.sign({ id: userId, role: role }, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
};

/**
 * Middleware to authenticate a token from the Authorization header.
 * Verifies the token and attaches user information (id, role) to req.user.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  if (!JWT_SECRET) {
    // This check is crucial if process.exit(1) was not used above.
    console.error("JWT_SECRET is not configured. Cannot verify token.");
    res.status(500).json({ message: 'Internal server error: JWT secret not configured.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: Role; iat: number; exp: number };

    // Optional: Re-fetch user from DB to ensure they exist and role hasn't changed.
    // This adds overhead (a DB query per authenticated request).
    // Enable if strict, real-time validation is critical.
    // const dbUser = await authService.findUserById(decoded.id);
    // if (!dbUser || dbUser.role !== decoded.role) {
    //   return res.status(401).json({ message: 'Invalid token. User data mismatch or user not found.' });
    // }
    // req.user = { id: dbUser.id, role: dbUser.role };

    // If not re-fetching from DB, trust the token's claims for its validity period.
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired. Please log in again.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      // Covers malformed tokens, invalid signatures, etc.
      res.status(403).json({ message: 'Invalid token. Authentication failed.' });
      return;
    }
    // Fallback for other unexpected errors during token verification
    console.error("Error during token verification:", error);
    res.status(500).json({ message: 'Failed to authenticate token due to an internal error.' });
    return;
  }
};

/**
 * Middleware to authorize users based on their roles.
 * Must be used AFTER authenticateToken middleware.
 * @param allowedRoles An array of Role enums that are permitted to access the route.
 */
export const authorizeRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || typeof req.user.role === 'undefined') {
      // This state implies authenticateToken might not have run or failed to attach user
      res.status(401).json({ message: 'Authentication token is valid, but user information is missing.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Your role ('${req.user.role}') is not authorized to access this resource.`,
        requiredRoles: allowedRoles,
      });
      return;
    }
    next(); // User has one of the allowed roles
  };
};
