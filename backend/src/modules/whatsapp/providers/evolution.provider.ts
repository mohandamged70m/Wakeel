import { Injectable } from "@nestjs/common";
import { NormalizedMessage, WhatsAppProvider, ListPayload } from "./whatsapp-provider.interface.js";

@Injectable()
export class EvolutionProvider implements WhatsAppProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly instance: string,
    private readonly webhookToken: string,
  ) {}

  verifyWebhook(headers: Record<string, string | undefined>): boolean {
    const token = headers["apikey"] ?? headers["x-webhook-token"];
    return !!token && token === this.webhookToken;
  }

  parseWebhook(rawBody: string): NormalizedMessage[] {
    let payload: unknown;
    try { payload = JSON.parse(rawBody); } catch { return []; }
    const p = (payload ?? {}) as Record<string, unknown>;
    const event = String(p.event ?? p.Event ?? "").toLowerCase();
    if (event && event !== "messages.upsert") return [];
    const data = (p.data ?? p.Data ?? {}) as Record<string, unknown>;
    const key = (data.key ?? {}) as Record<string, unknown>;
    const remoteJid: string = String(key.remoteJid ?? "");
    if (!remoteJid || remoteJid.includes("@g.us")) return [];
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
    const msg = (data.message ?? {}) as Record<string, unknown>;
    const text =
      (msg.conversation as string | undefined) ??
      ((msg.extendedTextMessage as Record<string, unknown> | undefined)?.text as string | undefined) ??
      ((msg.imageMessage as Record<string, unknown> | undefined)?.caption as string | undefined) ??
      undefined;
    return [{
      provider: "evolution",
      instanceOrPhoneId: this.instance,
      from: phone,
      whatsappMessageId: String(key.id ?? ""),
      type: String(data.messageType ?? "text"),
      text,
      pushName: data.pushName as string | undefined,
      timestamp: Number(data.messageTimestamp ?? Math.floor(Date.now() / 1000)),
      fromMe: Boolean(key.fromMe),
    }];
  }

  async sendText(to: string, body: string): Promise<{ messageId: string }> {
    const number = to.replace("@s.whatsapp.net", "");
    const res = await fetch(`${this.baseUrl}/message/sendText/${this.instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: this.apiKey },
      body: JSON.stringify({ number, text: body }),
    });
    if (!res.ok) throw new Error(`Evolution sendText failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as Record<string, unknown>;
    const key = (json.key ?? {}) as Record<string, unknown>;
    return { messageId: String(key.id ?? json.messageId ?? "") };
  }

  async sendList(to: string, list: ListPayload): Promise<{ messageId: string }> {
    const number = to.replace("@s.whatsapp.net", "");
    const res = await fetch(`${this.baseUrl}/message/sendList/${this.instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: this.apiKey },
      body: JSON.stringify({
        number,
        title: list.header,
        description: list.body,
        buttonText: list.buttonText,
        sections: list.sections,
      }),
    });
    if (!res.ok) throw new Error(`Evolution sendList failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as Record<string, unknown>;
    const key = (json.key ?? {}) as Record<string, unknown>;
    return { messageId: String(key.id ?? "") };
  }

  async health(): Promise<{ connected: boolean; state: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/instance/connectionState/${this.instance}`, {
        headers: { apikey: this.apiKey },
      });
      if (!res.ok) return { connected: false, state: "error" };
      const json = (await res.json()) as Record<string, unknown>;
      const instance = (json.instance ?? {}) as Record<string, unknown>;
      const state = String(instance.state ?? json.state ?? "unknown");
      return { connected: state === "open", state };
    } catch {
      return { connected: false, state: "unreachable" };
    }
  }
}
