import { Module } from "@nestjs/common";
import { DataModule } from "../data/data.module.js";
import { MenuController } from "./menu.controller.js";

@Module({
  imports: [DataModule],
  controllers: [MenuController],
})
export class MenuModule {}