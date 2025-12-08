import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
import { Location, LocationSchema } from "./location.schema";
import { WeatherData, WeatherDataSchema } from "./weather-data.schema";

@Schema({ timestamps: true })
export class Weather extends Document {
  @Prop({ required: true })
  timestamp!: string;

  @Prop({ type: LocationSchema, required: true })
  location!: Location;

  @Prop({ type: WeatherDataSchema, required: true })
  weather!: WeatherData;

  @Prop({ required: true })
  source!: string;
}

export type WeatherDocument = HydratedDocument<Weather>;
export const WeatherSchema = SchemaFactory.createForClass(Weather);
