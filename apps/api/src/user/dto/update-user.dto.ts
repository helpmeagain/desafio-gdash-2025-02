import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import {
  IsOptional,
  MinLength,
  IsEmail,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEmail({}, { message: "O e-mail deve ser um endereço de e-mail válido." })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres." })
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "O nome não pode exceder 100 caracteres." })
  name?: string;
}
