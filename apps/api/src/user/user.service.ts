import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { User, UserDocument } from "./schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      email: createUserDto.email.toLowerCase(),
    });

    return createdUser.save();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const lowercasedEmail = email.toLowerCase();
    return await this.userModel.findOne({ email: lowercasedEmail }).exec();
  }
}
