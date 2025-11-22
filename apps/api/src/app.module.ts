import { Module } from "@nestjs/common";
import { WeatherModule } from "./weather/weather.module";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URL || "mongodb://localhost:27017",
    ),
    WeatherModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
