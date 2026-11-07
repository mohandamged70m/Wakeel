import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WhatsAppProvider } from "./providers/whatsapp-provider.interface.js";
import { EvolutionProvider } from "./providers/evolution.provider.js";
import { MetaProvider } from "./providers/meta.provider.js";

@Injectable()
export class WhatsAppService {
  readonly provider: WhatsAppProvider;

  constructor(private readonly config: ConfigService) {
    const name = (this.config.get<string>("WHATSAPP_PROVIDER") ?? "evolution").toLowerCase();
    if (name === "evolution") {
      this.provider = new EvolutionProvider(
        this.config.get<string>("EVOLUTION_BASE_URL") ?? "http://localhost:8080",
        this.config.get<string>("EVOLUTION_API_KEY") ?? "",
        this.config.get<string>("EVOLUTION_INSTANCE") ?? "main",
        this.config.get<string>("EVOLUTION_WEBHOOK_TOKEN") ?? "",
      );
    } else if (name === "meta") {
      this.provider = new MetaProvider();
    } else {
      throw new Error(`Unknown WhatsApp provider: ${name}`);
    }
  }

  getProvider(): WhatsAppProvider {
    return this.provider;
  }
}
