import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";

import {
  PaginatedResponseDto,
  PaginationMetaDto,
  StarshipDto,
} from "./dto/starship.dto";
import { ConfigService } from "@nestjs/config";

interface SwapiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable()
export class SwapiService {
  private readonly swapiUrl: string;
  private readonly itemsPerPage: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService
  ) {
    this.swapiUrl = this.config.get<string>("SWAPI_URL")!;
    this.itemsPerPage = 10;
  }

  async getStarships(
    page: number = 1
  ): Promise<PaginatedResponseDto<StarshipDto>> {
    if (page < 1) {
      throw new BadRequestException("A página deve ser >= 1");
    }

    const url = `${this.swapiUrl}starships/?page=${page}`;

    let data: SwapiResponse<any>;

    try {
      const response = await firstValueFrom(
        this.httpService.get<SwapiResponse<any>>(url)
      );
      data = response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;

        if (status === 404) {
          throw new NotFoundException(
            "Endpoint ou recurso não encontrado na SWAPI"
          );
        }

        if (status === 429) {
          throw new ServiceUnavailableException(
            "SWAPI está limitando requisições (Rate Limit: 429)"
          );
        }

        if (status! >= 500) {
          throw new ServiceUnavailableException(
            "Erro interno na SWAPI. Tente novamente mais tarde."
          );
        }
      }

      throw new ServiceUnavailableException(
        "Não foi possível completar a requisição para a SWAPI."
      );
    }

    const totalItems = data.count;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);

    const meta: PaginationMetaDto = {
      totalItems,
      itemsPerPage: this.itemsPerPage,
      totalPages,
      currentPage: page,
      hasNext: data.next !== null,
      hasPrevious: data.previous !== null,
    };

    return {
      meta,
      data: data.results,
    };
  }
}
