import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class LocationDto {
  @IsString()
  @IsNotEmpty({ message: "City não pode ser vazio" })
  city: string = "";

  @IsString()
  @IsNotEmpty({ message: "State não pode ser vazio" })
  state: string = "";

  @IsNumber() lat: number = 0;
  @IsNumber() lon: number = 0;
}
