import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from "@nestjs/common";
import { SwapiService } from "./swapi.service";
import { PaginatedResponseDto, StarshipDto } from "./dto/starship.dto";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";

@Controller("swapi")
export class SwapiController {
  constructor(private readonly swapiService: SwapiService) {}

  @Get("starships")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Retorna uma lista paginada de Starships da SWAPI.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    example: 1,
  })
  @ApiBearerAuth()
  async getStarships(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<PaginatedResponseDto<StarshipDto>> {
    return await this.swapiService.getStarships(page);
  }
}
