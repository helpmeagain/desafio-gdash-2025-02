import { ApiProperty } from "@nestjs/swagger";

export class StarshipDto {
  @ApiProperty({ description: "O nome da nave/starship." })
  name!: string;

  @ApiProperty({ description: "O modelo da nave." })
  model!: string;

  @ApiProperty({ description: "Fabricante da nave." })
  manufacturer!: string;

  [key: string]: any;
}

export class PaginationMetaDto {
  @ApiProperty({
    description: "Número total de itens encontrados na base de dados.",
    example: 36,
  })
  totalItems!: number;

  @ApiProperty({
    description: "Itens por página (fixo pela SWAPI).",
    example: 10,
  })
  itemsPerPage!: number;

  @ApiProperty({ description: "Número total de páginas.", example: 4 })
  totalPages!: number;

  @ApiProperty({ description: "Página atual sendo exibida.", example: 1 })
  currentPage!: number;

  @ApiProperty({
    description: "Indica se há uma próxima página de resultados.",
    example: true,
  })
  hasNext!: boolean;

  @ApiProperty({
    description: "Indica se há uma página anterior de resultados.",
    example: false,
  })
  hasPrevious!: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: "Metadados da paginação.",
    type: PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
  @ApiProperty({
    description: "Array dos resultados da página atual.",
    type: [StarshipDto],
  })
  data!: T[];
}
