import { Module } from "@nestjs/common";
import { DataModule } from "../data/data.module.js";
import { ConversationsController } from "./conversations.controller.js";

@Module({
  imports: [DataModule],
  controllers: [ConversationsController],
})
export class ConversationsModule {}