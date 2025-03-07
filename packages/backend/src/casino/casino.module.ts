import { Module } from '@nestjs/common';
import { CasinoApiService } from './casino-api.service';

@Module({
  providers: [CasinoApiService],
  exports: [CasinoApiService],
})
export class CasinoModule {} 