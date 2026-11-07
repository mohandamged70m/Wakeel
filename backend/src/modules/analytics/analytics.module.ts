import { Module } from "@nestjs/common";
import { DataModule } from "../data/data.module.js";
import { AnalyticsController } from "./analytics.controller.js";

@Module({
  imports: [DataModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}