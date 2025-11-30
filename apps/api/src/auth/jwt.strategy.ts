import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";

@Injectable()
export class JwtStrategy {
  constructor(
    private jwtService: JwtService,
    private userService: UserService
  ) {}

  async validateToken(token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      return this.userService.findOneByEmail(decoded.email);
    } catch {
      return null;
    }
  }
}
