import { Module } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { WeatherController } from "./weather.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Weather, WeatherSchema } from "./schemas/weather.schema";
import { WeatherInsight, WeatherInsightSchema } from "./schemas/insight.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Weather.name, schema: WeatherSchema },
      { name: WeatherInsight.name, schema: WeatherInsightSchema },
    ]),
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
