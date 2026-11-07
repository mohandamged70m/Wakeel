import { Module } from "@nestjs/common";
import { DataModule } from "../data/data.module.js";
import { CustomersController } from "./customers.controller.js";

@Module({
  imports: [DataModule],
  controllers: [CustomersController],
})
export class CustomersModule {}