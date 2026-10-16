import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from './config/configuration';
import { PrismaService } from './prisma/prisma.service';

@Module({})
export class AppModule {
  static forRoot(config = ConfigService.loadAndValidate()): DynamicModule {
    return {
      module: AppModule,
      imports: [],
      providers: [PrismaService],
      exports: [PrismaService]
    };
  }
}
