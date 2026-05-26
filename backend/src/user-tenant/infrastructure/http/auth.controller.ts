import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../../shared/auth/public.decorator';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { SignupTenantUseCase } from '../../application/use-cases/signup-tenant.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { LoginRequestDto } from './dto/login.request.dto';
import { SignupRequestDto } from './dto/signup.request.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signup: SignupTenantUseCase,
    private readonly login: LoginUseCase,
    private readonly getMe: GetMeUseCase,
  ) {}

  @Public()
  @Post('signup')
  async signupTenant(@Body() dto: SignupRequestDto) {
    return this.signup.execute({
      tenantName: dto.tenantName,
      slug: dto.slug,
      adminEmail: dto.adminEmail,
      adminPassword: dto.adminPassword,
      adminFullName: dto.adminFullName,
    });
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async loginUser(@Body() dto: LoginRequestDto) {
    return this.login.execute({
      email: dto.email,
      password: dto.password,
      tenantSlug: dto.tenantSlug,
    });
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    return this.getMe.execute(user.sub, user.tenantId);
  }
}
