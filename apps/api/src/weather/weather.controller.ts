import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { CreateWeatherDto } from "./dto/create-weather.dto";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/auth.guard";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("/logs")
  create(@Body() createWeatherDto: CreateWeatherDto) {
    return this.weatherService.create(createWeatherDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/logs")
  findAll() {
    return this.weatherService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/export.csv")
  async exportCsv(
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const buffer = await this.weatherService.exportCsv();

    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="weather.csv"',
      "Content-Length": buffer.length,
    });

    return new StreamableFile(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/export.xlsx")
  async exportXlsx(
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const buffer = await this.weatherService.exportXlsx();

    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="weather.xlsx"',
      "Content-Length": buffer.length,
    });

    return new StreamableFile(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/insights")
  async generateInsights() {
    return this.weatherService.generateInsights();
  }
}
