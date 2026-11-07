import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WhatsAppController } from "./whatsapp.controller.js";
import { WhatsAppHealthController } from "./whatsapp-health.controller.js";
import { WhatsAppService } from "./whatsapp.service.js";
import { QueueService } from "./queue.service.js";
import { DataModule } from "../data/data.module.js";

@Module({
  imports: [ConfigModule, DataModule],
  controllers: [WhatsAppController, WhatsAppHealthController],
  providers: [WhatsAppService, QueueService],
  exports: [WhatsAppService, QueueService],
})
export class WhatsAppModule {}
