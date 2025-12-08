import { Controller, Get } from "@nestjs/common";
import { SourceService } from "./source.service";
import { ApiOperation } from "@nestjs/swagger";

@Controller("source")
export class SourceController {
  constructor(private readonly sourceService: SourceService) {}

  @Get("repo")
  @ApiOperation({
    summary: "Repositório de código aberto",
  })
  getRepoLink() {
    return this.sourceService.getRepoLink();
  }

  @Get("license")
  @ApiOperation({
    summary: "Licença do projeto",
  })
  getLicense() {
    return this.sourceService.getLicense();
  }
}
