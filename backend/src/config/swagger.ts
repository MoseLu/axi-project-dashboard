import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Axi Deploy Dashboard API',
      version: '1.0.0',
      description: 'Axi Deploy Dashboard 后端 API 文档',
      contact: {
        name: '运维团队',
        email: 'devops@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: '开发环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/models/*.ts']
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
