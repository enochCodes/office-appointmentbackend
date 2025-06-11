import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Appointment System API',
      version: '1.0.0',
      description: 'API documentation for the Appointment Scheduling System.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Validation errors (if applicable)',
            },
          },
          required: ['message'],
        },
        Appointment: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'cuid', description: 'Appointment ID' },
                visitorName: { type: 'string', description: 'Name of the visitor' },
                email: { type: 'string', format: 'email', description: 'Email of the visitor' },
                phone: { type: 'string', nullable: true, description: 'Phone number of the visitor' },
                preferredDate: { type: 'string', format: 'date-time', description: 'Preferred date and time for the appointment' },
                message: { type: 'string', nullable: true, description: 'Optional message from the visitor' },
                directorId: { type: 'string', format: 'cuid', description: 'ID of the director for the appointment' },
                status: { type: 'string', enum: ['PENDING', 'VERIFIED', 'REJECTED'], description: 'Status of the appointment' },
                submittedById: { type: 'string', format: 'cuid', nullable: true, description: 'ID of the user who submitted the appointment (if registered)' },
                processedById: { type: 'string', format: 'cuid', nullable: true, description: 'ID of the user who processed the appointment' },
                createdAt: { type: 'string', format: 'date-time', description: 'Timestamp of when the appointment was created' },
            }
        },
        PublicAppointmentRequest: {
            type: 'object',
            required: ['visitorName', 'email', 'preferredDate', 'directorId'],
            properties: {
                visitorName: { type: 'string', example: 'John Doe' },
                email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                phone: { type: 'string', nullable: true, example: '123-456-7890' },
                preferredDate: { type: 'string', format: 'date-time', example: '2024-08-01T10:00:00.000Z' },
                message: { type: 'string', nullable: true, example: 'Meeting to discuss project X.' },
                directorId: { type: 'string', format: 'cuid', example: 'clxkz21rb0000abcdef12345' }
            }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
