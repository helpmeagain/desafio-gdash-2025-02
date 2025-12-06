import { Module } from "@nestjs/common";
import { WeatherModule } from "./weather/weather.module";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { SwapiModule } from "./swapi/swapi.module";
import { SourceModule } from './source/source.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`${__dirname}/../.env`],
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URL || "mongodb://localhost:27017/weather_data",
    ),
    WeatherModule,
    UserModule,
    AuthModule,
    SwapiModule,
    SourceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
