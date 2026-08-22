process.env.TZ = 'UTC';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerService } from './shared/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Set Winston as the global application logger
  app.useLogger(logger);

  // Enable security headers and payload compression
  app.use(helmet());
  app.use(compression());

  // Enable API Versioning on URI (e.g. /api/v1/...)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Enable CORS
  app.enableCors({
    origin: '*', // Customize this for production to restrict to tenant domains
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Pipelines Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Global Response Interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Configure Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Grehasoft Enterprise Portal API')
    .setDescription(
      'Technical foundation API schema registry for Project Management, CRM, HR, Finance, and SEO.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT) || 3000;

await app.listen(port, '0.0.0.0');

logger.log(`==================================================`, 'Bootstrap');
logger.log(
  `🚀 Grehasoft backend is running on port ${port}`,
  'Bootstrap',
);
logger.log(
  `📑 Swagger Documentation is available on port ${port}/docs`,
  'Bootstrap',
);
logger.log(`==================================================`, 'Bootstrap');
}
bootstrap();
