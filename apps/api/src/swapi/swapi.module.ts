import { Module } from "@nestjs/common";
import { SwapiService } from "./swapi.service";
import { SwapiController } from "./swapi.controller";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  controllers: [SwapiController],
  providers: [SwapiService],
})
export class SwapiModule {}
