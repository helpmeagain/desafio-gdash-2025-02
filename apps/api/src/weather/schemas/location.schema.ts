import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class Location {
  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  lat!: number;

  @Prop({ required: true })
  lon!: number;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
