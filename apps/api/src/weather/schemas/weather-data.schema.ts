import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class WeatherData {
  @Prop({ required: true })
  temperature_c!: number;

  @Prop({ required: true })
  humidity_percent!: number;

  @Prop({ required: true })
  wind_speed_kmh!: number;

  @Prop({ required: true })
  rain_probability!: number;

  @Prop({ required: true })
  condition_code!: number;
}

export const WeatherDataSchema = SchemaFactory.createForClass(WeatherData);
