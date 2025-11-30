import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../user/user.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);

    if (!user || user === undefined) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    const passwordMatches = await bcrypt.compare(password, user.password!);
    if (!passwordMatches) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
