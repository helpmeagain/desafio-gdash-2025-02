import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { WinstonModule, utilities as nestWinstonUtilities } from "nest-winston";
import { transports, format } from "winston";
import "winston-daily-rotate-file";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            format.ms(),
            nestWinstonUtilities.format.nestLike("WeatherApp", {
              colors: true,
              prettyPrint: true,
            })
          ),
        }),

        new transports.DailyRotateFile({
          filename: "logs/application-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
    }),
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  );
  app.use(cookieParser());
  app.enableCors({
    origin: [
      "http://localhost:8080",
      "http://web:80",
      "http://localhost:5173/",
    ],
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle("Weather API")
    .setDescription("API para consumo de informações sobre o clima")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
