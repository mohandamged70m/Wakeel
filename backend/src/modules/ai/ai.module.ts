import { Module } from "@nestjs/common";
import { DataModule } from "../data/data.module.js";
import { AiService } from "./ai.service.js";

@Module({
  imports: [DataModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}