import { IsString, Length } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @Length(64, 512)
  refreshToken!: string;
}
