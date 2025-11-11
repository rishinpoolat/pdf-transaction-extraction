import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PDF Transaction Extraction API',
      version: '1.0.0',
      description: 'API for extracting and managing transactions from PDF bank statements',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5001}`,
        description: 'Development server',
      },
      {
        url: 'https://api.production.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'number',
              example: 0,
            },
            statusCode: {
              type: 'number',
              example: 400,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errorDetails: {
              type: 'object',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-11T15:16:55.911Z',
            },
            uptime: {
              type: 'number',
              example: 123.456,
            },
            environment: {
              type: 'string',
              example: 'development',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
    ],
  },
  apis: [
    './src/index.ts',
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
