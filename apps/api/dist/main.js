"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('M5 API')
        .setDescription('M5 multi-tenant SaaS API gateway and backbone service.')
        .setVersion('0.1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = Number(process.env.API_PORT ?? 3001);
    await app.listen(port);
    console.warn(`M5 API is running on http://localhost:${port}/api/v1`);
    console.warn(`Foundation blueprint is available at http://localhost:${port}/api/v1/foundation/bootstrap`);
}
bootstrap();
//# sourceMappingURL=main.js.map