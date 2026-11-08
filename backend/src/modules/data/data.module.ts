import { Module } from "@nestjs/common";
import { SupabaseModule } from "../supabase/supabase.module.js";
import { MemoryStore } from "./memory-store.js";
import { WhatsAppAccountsRepository } from "./repositories/whatsapp-accounts.repository.js";
import { CustomersRepository } from "./repositories/customers.repository.js";
import { ConversationsRepository } from "./repositories/conversations.repository.js";
import { MessagesRepository } from "./repositories/messages.repository.js";
import { MenuRepository } from "./repositories/menu.repository.js";
import { OrdersRepository } from "./repositories/orders.repository.js";
import { AutomationsRepository } from "./repositories/automations.repository.js";
import { EscalationsRepository } from "./repositories/escalations.repository.js";

@Module({
  imports: [SupabaseModule],
  providers: [
    MemoryStore,
    WhatsAppAccountsRepository,
    CustomersRepository,
    ConversationsRepository,
    MessagesRepository,
    MenuRepository,
    OrdersRepository,
    AutomationsRepository,
    EscalationsRepository,
  ],
  exports: [
    MemoryStore,
    WhatsAppAccountsRepository,
    CustomersRepository,
    ConversationsRepository,
    MessagesRepository,
    MenuRepository,
    OrdersRepository,
    AutomationsRepository,
    EscalationsRepository,
  ],
})
export class DataModule {}
