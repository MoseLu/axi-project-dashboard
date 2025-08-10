"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUi = exports.specs = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const options = {
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
const specs = (0, swagger_jsdoc_1.default)(options);
exports.specs = specs;
//# sourceMappingURL=swagger.js.map