import { Module } from "@nestjs/common";
import { DataModule } from "../data/data.module.js";
import { OrdersController } from "./orders.controller.js";

@Module({
  imports: [DataModule],
  controllers: [OrdersController],
})
export class OrdersModule {}