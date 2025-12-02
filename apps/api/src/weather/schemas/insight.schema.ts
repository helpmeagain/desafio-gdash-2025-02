import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class WeatherInsight {
  @Prop({ required: true })
  date!: string;

  @Prop({ required: true })
  recordCount!: number;

  @Prop({ type: Object, required: true })
  insight: any;
}

export type WeatherInsightDocument = WeatherInsight & Document;
export const WeatherInsightSchema =
  SchemaFactory.createForClass(WeatherInsight);
