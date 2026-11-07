export type NormalizedMessage = {
  provider: "evolution" | "meta";
  instanceOrPhoneId: string;
  from: string;
  whatsappMessageId: string;
  type: string;
  text?: string;
  pushName?: string;
  timestamp: number;
  fromMe: boolean;
};

export interface ListPayload {
  header: string;
  body: string;
  buttonText: string;
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[];
}

export interface WhatsAppProvider {
  verifyWebhook(headers: Record<string, string | undefined>, rawBody: string): boolean;
  parseWebhook(rawBody: string): NormalizedMessage[];
  sendText(to: string, body: string): Promise<{ messageId: string }>;
  sendList(to: string, list: ListPayload): Promise<{ messageId: string }>;
  health(): Promise<{ connected: boolean; state: string }>;
}
