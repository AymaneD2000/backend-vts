import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

// Mali phone numbers: 8 digits, optionally with +223 country code.
const PHONE_REGEX = /^(\+223)?[0-9]{8}$/;

export class RequestOtpDto {
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'phone must be a valid Mali number' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'phone must be a valid Mali number' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(4, 8)
  code: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
