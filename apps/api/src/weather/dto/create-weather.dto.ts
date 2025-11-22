import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { LocationDto } from "./location.dto";
import { WeatherDto } from "./weather.dto";

export class CreateWeatherDto {
  @IsNotEmpty()
  @IsDateString()
  timestamp: string = "";

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @IsObject()
  @ValidateNested()
  @Type(() => WeatherDto)
  weather!: WeatherDto;

  @IsString()
  @IsNotEmpty()
  source: string = "";
}
