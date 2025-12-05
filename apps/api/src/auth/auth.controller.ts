import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import type { Response, Request } from "express";
import { ApiOperation } from "@nestjs/swagger";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ApiOperation({
    summary: "Fazer login usando email e senha",
  })
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { access_token, refresh_token, user } = await this.authService.login(
      loginDto.email,
      loginDto.password
    );

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SEVEN_DAYS,
    });

    return { access_token, user };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh no token",
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) throw new UnauthorizedException();

    const {
      access_token,
      refresh_token: newRefresh,
      user,
    } = await this.authService.refreshTokens(refreshToken);

    res.cookie("refresh_token", newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SEVEN_DAYS,
    });

    return { access_token, user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Sair da conta atual",
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies["refresh_token"];
    if (refreshToken) {
      try {
        const decoded: any =
          await this.authService["jwtService"].verifyAsync(refreshToken);
        await this.authService.logout(decoded.sub);
      } catch (e) {}
    }
    res.clearCookie("refresh_token", { path: "/" });
    return { ok: true };
  }
}
