import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { UserService } from "./user.service";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { Role, User, UserDocument } from "./schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly email: string;
  private readonly password: string;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly userService: UserService,
    private readonly config: ConfigService
  ) {
    this.email = this.config.get<string>("ADMIN_EMAIL")!;
    this.password = this.config.get<string>("ADMIN_PASSWORD")!;
  }

  async onApplicationBootstrap() {
    const existing = await this.userService.findOneByEmail(this.email);
    if (existing) {
      console.log("[Seeder] Admin já existe");
      return;
    }

    const hashedPassword = await bcrypt.hash(this.password, 10);

    const createdUser = new this.userModel({
      name: "admin",
      password: hashedPassword,
      email: this.email.toLowerCase(),
      role: Role.Admin,
    });

    console.log("[Seeder] Admin criado!");
    return createdUser.save();
  }
}
