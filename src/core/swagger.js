/**
 * Swagger/OpenAPI Configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Citoyen Avisé API',
      version: '1.0.0',
      description: 'REST API for the Citoyen Avisé civic platform',
      contact: {
        name: 'Citoyen Avisé Team',
        email: 'infocitoyenavise@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.citoyenavise.org',
        description: 'Production server',
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
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['citizen', 'moderator', 'admin'] },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'username', 'role'],
        },
        Idea: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            userId: { type: 'string', format: 'uuid' },
            likesCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'description', 'category', 'userId'],
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' },
          },
          required: ['error'],
        },
      },
    },
  },
  apis: [
    './src/modules/auth/routes.js',
    './src/modules/ideas/routes.js',
    './src/modules/posts/routes.js',
    './src/modules/profiles/routes.js',
    './src/modules/users/routes.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
