export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  roles: string[];
  permissions: string[];
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface VerifyEmailRequestDto {
  email: string;
  token: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface ApiEnvelope<T = unknown> {
  isSuccess: boolean;
  data?: T;
  message?: string | null;
  error?: string | null;
}
