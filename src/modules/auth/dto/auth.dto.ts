import { IsOptional, IsString, Length, Matches } from 'class-validator';

// Mali phone numbers: 8 digits, optionally with +223 country code.
const PHONE_REGEX = /^(\+223)?[0-9]{8}$/;

export class RequestOtpDto {
  @Matches(PHONE_REGEX, { message: 'phone must be a valid Mali number' })
  phone: string;
}

export class VerifyOtpDto {
  @Matches(PHONE_REGEX, { message: 'phone must be a valid Mali number' })
  phone: string;

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
