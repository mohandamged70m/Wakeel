import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SupabaseModule } from "./modules/supabase/supabase.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { OrganizationsModule } from "./modules/organizations/organizations.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { WhatsAppModule } from "./modules/whatsapp/whatsapp.module.js";
import { AiModule } from "./modules/ai/ai.module.js";
import { ConversationsModule } from "./modules/conversations/conversations.module.js";
import { MenuModule } from "./modules/menu/menu.module.js";
import { OrdersModule } from "./modules/orders/orders.module.js";
import { CustomersModule } from "./modules/customers/customers.module.js";
import { AutomationsModule } from "./modules/automations/automations.module.js";
import { AnalyticsModule } from "./modules/analytics/analytics.module.js";
import { NotificationsModule } from "./modules/notifications/notifications.module.js";
import { HealthModule } from "./modules/health/health.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    SupabaseModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    WhatsAppModule,
    AiModule,
    ConversationsModule,
    MenuModule,
    OrdersModule,
    CustomersModule,
    AutomationsModule,
    AnalyticsModule,
    NotificationsModule,
    HealthModule,
  ],
})
export class AppModule {}