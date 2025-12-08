import { IsNumber } from "class-validator";

export class WeatherDto {
  @IsNumber() temperature_c: number = 0;
  @IsNumber() humidity_percent: number = 0;
  @IsNumber() wind_speed_kmh: number = 0;
  @IsNumber() rain_probability: number = 0;
  @IsNumber() condition_code: number = 0;
}
