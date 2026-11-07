import { Module } from "@nestjs/common";
import { DataModule } from "../data/data.module.js";
import { AutomationsController } from "./automations.controller.js";

@Module({
  imports: [DataModule],
  controllers: [AutomationsController],
})
export class AutomationsModule {}