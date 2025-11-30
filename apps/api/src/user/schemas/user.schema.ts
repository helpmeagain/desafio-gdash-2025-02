import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    type: String,
    unique: true,
    index: true,
  })
  @Prop({ required: true, unique: true, index: true, lowercase: true })
  email?: string;

  @Prop({ required: true })
  password?: string;

  @Prop({ required: true })
  name?: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
