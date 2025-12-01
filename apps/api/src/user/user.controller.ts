import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
  Delete,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtAuthGuard } from "../auth/auth.guard";
import { ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: "Criar um novo usuário",
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("get-by-email/:email")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Encontrar usuário pelo email",
  })
  findOneByEmail(@Param("email") email: string) {
    return this.userService.findOneByEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get("get-by-id/:id")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Encontrar usuário pelo id",
  })
  findOneById(@Param("id") id: string) {
    return this.userService.findOneById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Fetch de usuários paginado",
  })
  @ApiQuery({
    name: "page",
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    example: 10,
  })
  findAll(@Query("page") page: number = 1, @Query("limit") limit: number = 10) {
    return this.userService.findAllPaginated(+page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Atualizar dados de usuário",
  })
  update(@Param("id") id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Deletar usuário",
  })
  remove(@Param("id") id: string) {
    return this.userService.remove(id);
  }
}
