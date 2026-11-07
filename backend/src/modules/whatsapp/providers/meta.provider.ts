import { Injectable } from "@nestjs/common";
import { NormalizedMessage, WhatsAppProvider, ListPayload } from "./whatsapp-provider.interface.js";

// Stub: implement when upgrading from Evolution to Meta Cloud API.
@Injectable()
export class MetaProvider implements WhatsAppProvider {
  verifyWebhook(_headers: Record<string, string | undefined>, _rawBody: string): boolean { return false; }
  parseWebhook(_rawBody: string): NormalizedMessage[] { return []; }
  async sendText(_to: string, _body: string): Promise<{ messageId: string }> { throw new Error("MetaProvider not implemented"); }
  async sendList(_to: string, _list: ListPayload): Promise<{ messageId: string }> { throw new Error("MetaProvider not implemented"); }
  async health(): Promise<{ connected: boolean; state: string }> { return { connected: false, state: "not-implemented" }; }
}
