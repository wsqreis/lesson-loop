import { Module } from '@nestjs/common'
import { ActivationController } from './activation.controller.js'
import { ActivationService } from './activation.service.js'
import { AppController } from './app.controller.js'
import { PrismaService } from './prisma.service.js'

@Module({
  controllers: [AppController, ActivationController],
  providers: [ActivationService, PrismaService],
})
export class AppModule {}
