import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { UserService } from "./user.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly email: string;
  private readonly password: string;

  constructor(
    private readonly userService: UserService,
    private readonly config: ConfigService,
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

    await this.userService.create({
      name: "admin",
      email: this.email,
      password: this.password,
    });

    console.log("[Seeder] Admin criado!");
  }
}
