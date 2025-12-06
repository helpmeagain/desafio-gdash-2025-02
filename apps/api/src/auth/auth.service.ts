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
    if (!user) throw new UnauthorizedException("Usuário não encontrado");
    const passwordMatches = await bcrypt.compare(password, user.password!);
    if (!passwordMatches)
      throw new UnauthorizedException("Credenciais inválidas");
    return user;
  }

  async generateAccessToken(payload: any) {
    return this.jwtService.signAsync(payload);
  }

  async generateRefreshToken(payload: any) {
    return this.jwtService.signAsync(payload, { expiresIn: "7d" });
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const access_token = await this.generateAccessToken(payload);
    const refresh_token = await this.generateRefreshToken({ sub: user._id });

    const refreshHash = await bcrypt.hash(refresh_token, 10);
    await this.userService.setRefreshTokenHash(
      user._id.toString(),
      refreshHash
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded: any = await this.jwtService.verifyAsync(refreshToken);
      const userId = decoded.sub;
      const user = await this.userService.findOneByIdWithRefreshHash(userId);
      if (!user || !user.refreshTokenHash) throw new UnauthorizedException();

      const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!matches) throw new UnauthorizedException();

      const payload = {
        sub: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const newAccess = await this.generateAccessToken(payload);
      const newRefresh = await this.generateRefreshToken({ sub: user._id });

      const newHash = await bcrypt.hash(newRefresh, 10);
      await this.userService.setRefreshTokenHash(user._id.toString(), newHash);

      return {
        access_token: newAccess,
        refresh_token: newRefresh,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  async logout(userId: string) {
    await this.userService.removeRefreshTokenHash(userId);
  }
}
