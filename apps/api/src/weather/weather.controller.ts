import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  StreamableFile,
  UseGuards,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { CreateWeatherDto } from "./dto/create-weather.dto";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/auth.guard";
import { ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";

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
  @Get("/get-by-date/logs")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Capturar logs por dia",
  })
  @ApiQuery({
    name: "date",
    required: false,
    description: "Data no formato YYYY-MM-DD. Se omitido, usa hoje.",
  })
  getByDate(@Query("date") date?: string) {
    return this.weatherService.findByDate(date);
  }

  @UseGuards(JwtAuthGuard)
  @Get("export-by-date/csv")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Exportar dados como .CSV para uma data específica",
  })
  @ApiQuery({
    name: "date",
    required: false,
    description: "Data no formato YYYY-MM-DD. Se omitido, usa hoje.",
  })
  async exportCsv(
    @Query("date") date: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.weatherService.exportCsv(date);

    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="weather${date ? "-" + date : ""}.csv"`,
      "Content-Length": buffer.length,
    });

    return new StreamableFile(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get("export-by-date/xlsx")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Exportar dados como .XLSX para uma data específica",
  })
  @ApiQuery({
    name: "date",
    required: false,
    description: "Data no formato YYYY-MM-DD. Se omitido, usa hoje.",
  })
  async exportXlsx(
    @Query("date") date: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.weatherService.exportXlsx(date);

    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="weather${date ? "-" + date : ""}.xlsx"`,
      "Content-Length": buffer.length,
    });

    return new StreamableFile(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/get-by-date/insights")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Gerar insights com inteligência artificial para uma data",
  })
  @ApiQuery({
    name: "date",
    required: false,
    description: "Data no formato YYYY-MM-DD. Se omitido, usa hoje.",
  })
  async generateInsights(@Query("date") date?: string) {
    return this.weatherService.generateInsights(date);
  }
}
