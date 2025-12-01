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
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @UseGuards(JwtAuthGuard)
  @Post("/logs")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Inserir logs no banco",
  })
  create(@Body() createWeatherDto: CreateWeatherDto) {
    return this.weatherService.create(createWeatherDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/logs")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Capturar todos os logs do banco",
  })
  findAll() {
    return this.weatherService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get("/export.csv")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Exportar dados como .CSV",
  })
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
  @Get("/export.xlsx")
  @ApiBearerAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Exportar dados como .XLSX",
  })
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
  @Get("/insights")
  @ApiBearerAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Gerar insights com inteligência artificial",
  })
  async generateInsights() {
    return this.weatherService.generateInsights();
  }
}
