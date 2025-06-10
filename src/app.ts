import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from './prismaClient'; // Import prisma client
import { Prisma } from '@prisma/client'; // For Prisma error types
import jwt from 'jsonwebtoken'; // For JWT error types

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic root route for health check
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Appointment System API is running!' });
});

// Import and use routes
import authRoutes from './routes/authRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import adminRoutes from './routes/adminRoutes';
import calendarRoutes from './routes/calendarRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/calendar', calendarRoutes);


// Global error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(\`[\${new Date().toISOString()}] Path: \${req.path}, Method: \${req.method}\`);
  console.error(\`Error: \${err.message}\`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  let statusCode = 500;
  let publicErrorMessage = 'An unexpected error occurred. Please try again later.';

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle known Prisma request errors
    switch (err.code) {
      case 'P2000':
        statusCode = 400; // Bad Request
        publicErrorMessage = \`The value provided for field '\${err.meta?.target}' is too long.\`;
        break;
      case 'P2002': // Unique constraint violation
        statusCode = 409; // Conflict
        publicErrorMessage = \`A record with this value already exists for field(s): \${(err.meta?.target as string[])?.join(', ')}.\`;
        break;
      case 'P2003': // Foreign key constraint failed
        statusCode = 400; // Bad Request (e.g. trying to link to a non-existent record)
        publicErrorMessage = \`Invalid input: A related record for field '\${err.meta?.field_name}' does not exist.\`;
        break;
      case 'P2014': // Required relation violation (e.g. creating a director without a user)
         statusCode = 400;
         publicErrorMessage = \`The change you are trying to make would violate the required relation '\${err.meta?.relation_name}' between the '\${err.meta?.model_a_name}' and '\${err.meta?.model_b_name}' models.\`;
         break;
      case 'P2025': // Record to update or delete not found
        statusCode = 404; // Not Found
        publicErrorMessage = \`The requested resource to be modified or deleted was not found. \${err.meta?.cause || ''}\`;
        break;
      default:
        // For other Prisma errors, keep a more generic database error message
        console.error(\`Unhandled Prisma Error Code: \${err.code}\`, err.meta);
        statusCode = 500;
        publicErrorMessage = 'A database operation error occurred.';
        break;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400; // Bad Request due to validation failure at Prisma level
    publicErrorMessage = 'Invalid data provided. Please check your input.';
    // err.message often contains detailed field information from Prisma if needed for debugging
    console.error("Prisma Validation Error details:", err.message);
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401; // Unauthorized
    publicErrorMessage = 'Invalid or malformed authentication token.';
  } else if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401; // Unauthorized
    publicErrorMessage = 'Authentication token has expired. Please log in again.';
  } else if (err.name === 'SyntaxError' && 'status' in err && err.status === 400 && 'body' in err) {
    // Handle malformed JSON request body
    statusCode = 400;
    publicErrorMessage = 'Malformed JSON in request body.';
  }
  // Add more 'else if' blocks here for other custom error types if you define them
  // e.g., if (err instanceof MyCustomValidationError) { ... }


  res.status(statusCode).json({
    status: 'error',
    message: publicErrorMessage,
    // Optionally include more details in development
    ...(process.env.NODE_ENV === 'development' && {
        originalError: err.message,
        stack: err.stack
    }),
  });
});


// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(\`Server is running on http://localhost:\${PORT}\`);
    try {
      await prisma.\$queryRaw\`SELECT 1\`;
      console.log('Successfully connected to the database via Prisma.');
    } catch (error) {
      console.error('Failed to connect to the database:', error);
    }
  });
}

export default app;
