import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { StandardSchemaValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter.js";
import { RequestLoggingInterceptor } from "./common/interceptors/logging.interceptor.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" });
  app.useGlobalPipes(new StandardSchemaValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle("WhatsApp Order SaaS API")
    .setDescription("Backend API")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();