import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../app.module.js";

describe("WhatsApp webhook idempotency", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.EVOLUTION_WEBHOOK_TOKEN = "test-token";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const body = {
    event: "messages.upsert",
    data: {
      key: { remoteJid: "201001234567@s.whatsapp.net", id: "MSG001", fromMe: false },
      pushName: "Test",
      message: { conversation: "hello price" },
      messageTimestamp: 1700000000,
    },
  };

  it("accepts first delivery", async () => {
    const res = await request(app.getHttpServer())
      .post("/webhooks/whatsapp")
      .set("apikey", "test-token")
      .send(body)
      .expect(200);
    expect(res.body.received).toBe(1);
  });

  it("deduplicates second delivery", async () => {
    const res = await request(app.getHttpServer())
      .post("/webhooks/whatsapp")
      .set("apikey", "test-token")
      .send(body)
      .expect(200);
    expect(res.body.received).toBe(0);
  });

  it("rejects bad token with 401", async () => {
    await request(app.getHttpServer())
      .post("/webhooks/whatsapp")
      .set("apikey", "wrong")
      .send(body)
      .expect(401);
  });
});
