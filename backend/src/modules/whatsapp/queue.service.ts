import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WhatsAppService } from "./whatsapp.service.js";
import { AiService } from "../ai/ai.service.js";
import { Queue, Worker, Job } from "bullmq";

export type ProcessMessagePayload = {
  organizationId?: string;
  conversationId?: string;
  messageId?: string;
  from: string;
  text?: string;
  instanceOrPhoneId: string;
  whatsappMessageId?: string;
  type?: string;
  mediaUrl?: string | null;
};

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queue: Queue<ProcessMessagePayload> | null = null;
  private worker: Worker<ProcessMessagePayload> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsAppService,
    private readonly ai: AiService,
  ) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.config.get<string>("REDIS_URL");
    if (!redisUrl) return;
    try {
      const connection = { url: redisUrl };
      this.queue = new Queue<ProcessMessagePayload>("process-message", { connection });
      this.worker = new Worker<ProcessMessagePayload>(
        "process-message",
        async (job: Job<ProcessMessagePayload>) => {
          await this.process(job.data);
        },
        { connection },
      );
      this.worker.on("failed", (job, err) => {
        this.logger.error(`job ${job?.id} failed: ${err?.message ?? err}`);
      });
      this.logger.log("BullMQ queue+worker initialized");
    } catch (err) {
      this.logger.warn(`BullMQ init failed, falling back to inline: ${String(err)}`);
      this.queue = null;
      this.worker = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  async enqueue(payload: ProcessMessagePayload): Promise<void> {
    if (this.queue) {
      try {
        await this.queue.add("process-message", payload, {
          jobId: payload.whatsappMessageId || undefined,
          removeOnComplete: true,
        });
        return;
      } catch (err) {
        this.logger.warn(`enqueue failed, processing inline: ${String(err)}`);
      }
    }
    // Dev/inline path
    setImmediate(() => {
      this.process(payload).catch((err) =>
        this.logger.error(`process failed: ${err instanceof Error ? err.message : String(err)}`),
      );
    });
  }

  private async process(payload: ProcessMessagePayload): Promise<void> {
    this.logger.log(`processing message from ${payload.from}: ${payload.text?.slice(0, 60)}`);
    try {
      const result = await this.ai.processInbound(payload);
      if (result.reply) {
        await this.whatsapp.getProvider().sendText(payload.from, result.reply);
      }
    } catch (err) {
      this.logger.error(`process failed: ${err instanceof Error ? err.message : String(err)}`);
      try {
        await this.whatsapp.getProvider().sendText(payload.from, "Sorry, something went wrong. Please try again.");
      } catch {
        // ignore
      }
    }
  }
}
