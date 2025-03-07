import { Module } from '@nestjs/common';
import { SuperTokensService } from './supertokens.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
  providers: [SuperTokensService, AuthGuard],
  exports: [SuperTokensService, AuthGuard],
})
export class AuthModule {} 