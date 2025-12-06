import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserService } from "../user/user.service";
import { Role } from "../user/schemas/user.schema";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "dev_key",
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findOneByEmail(payload.email);

    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };
  }
}
