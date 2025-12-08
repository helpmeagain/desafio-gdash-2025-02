import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @IsEmail({}, { message: "O e-mail deve ser um endereço de e-mail válido." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  email: string = "";

  @IsString()
  @IsNotEmpty({ message: "A senha é obrigatória." })
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres." })
  password: string = "";

  @IsString()
  @IsNotEmpty({ message: "O nome é obrigatório." })
  @MaxLength(100, { message: "O nome não pode exceder 100 caracteres." })
  name: string = "";
}
