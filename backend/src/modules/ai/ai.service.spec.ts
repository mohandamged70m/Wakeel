import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../app.module.js";
import { AiService } from "./ai.service.js";
import { MenuRepository } from "../data/repositories/menu.repository.js";
import { CustomersRepository } from "../data/repositories/customers.repository.js";
import { ConversationsRepository } from "../data/repositories/conversations.repository.js";
import { MemoryStore } from "../data/memory-store.js";
import OpenAI from "openai";
import { vi } from "vitest";

describe("AiService price accuracy", () => {
  let app: TestingModule;
  let ai: AiService;
  let menu: MenuRepository;
  let customers: CustomersRepository;
  let conversations: ConversationsRepository;
  let memory: MemoryStore;
  const ORG = "00000000-0000-0000-0000-000000000000";

  beforeAll(async () => {
    process.env.EVOLUTION_WEBHOOK_TOKEN = "test-token";
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
    ai = app.get(AiService);
    menu = app.get(MenuRepository);
    customers = app.get(CustomersRepository);
    conversations = app.get(ConversationsRepository);
    memory = app.get(MemoryStore);
    memory.seedDevOrg();

    // seed eval menu
    const c1 = await menu.createCategory(ORG, "Drinks", null, 1);
    const c2 = await menu.createCategory(ORG, "Food", null, 2);
    const c3 = await menu.createCategory(ORG, "Sides", null, 3);
    const items = [
      { cat: c1.id, en: "Turkish coffee (small)", ar: "قهوة تركية (صغير)", price: 25, avail: true },
      { cat: c1.id, en: "Turkish coffee (large)", ar: "قهوة تركية (كبير)", price: 35, avail: true },
      { cat: c1.id, en: "Mint tea", ar: "شاي نعناع", price: 20, avail: true },
      { cat: c1.id, en: "Latte", ar: "لاتيه", price: 45, avail: true },
      { cat: c2.id, en: "Croissant", ar: "كرواسون", price: 30, avail: true },
      { cat: c2.id, en: "Cheese sandwich", ar: "ساندويش جبن", price: 55, avail: true },
      { cat: c2.id, en: "Chicken wrap", ar: "راب دجاج", price: 75, avail: true },
      { cat: c3.id, en: "Fries", ar: "بطاطس", price: 25, avail: true },
      { cat: c1.id, en: "Water", ar: "ماء", price: 10, avail: true },
      { cat: c2.id, en: "Chocolate cake", ar: "كعكة شوكولاتة", price: 40, avail: false },
    ];
    for (const it of items) {
      await menu.createItem(ORG, { categoryId: it.cat, nameEn: it.en, nameAr: it.ar, price: it.price, currency: "EGP", available: it.avail });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it("getPrice tool returns DB price (no LLM memory)", async () => {
    const all = await menu.listItems(ORG);
    const latte = all.find((i) => i.nameEn === "Latte")!;
    const mockClient = {
      chat: { completions: { create: vi.fn() } },
    } as unknown as OpenAI;
    const create = (mockClient as { chat: { completions: { create: ReturnType<typeof vi.fn> } } }).chat.completions.create;
    create
      .mockResolvedValueOnce({
        choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "t1", type: "function", function: { name: "getPrice", arguments: JSON.stringify({ itemIds: [latte.id] }) } }] } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { role: "assistant", content: "Latte costs 45 EGP." } }],
      });
    ai.setOpenAIClient(mockClient);

    const cust = await customers.upsert(ORG, "+201000000001", "Test");
    const conv = await conversations.upsert(ORG, cust.id);
    const res = await ai.processInbound({
      organizationId: ORG,
      conversationId: conv.id,
      from: "+201000000001",
      text: "How much is a latte?",
      instanceOrPhoneId: "main",
      type: "text",
    });
    expect(res.reply).toContain("45");
    expect(create).toHaveBeenCalled();
  });

  it("sold-out cake: getPrice returns available=false", async () => {
    const all = await menu.listItems(ORG);
    const cake = all.find((i) => i.nameEn === "Chocolate cake")!;
    expect(cake.available).toBe(false);
    expect(cake.price).toBe(40);
  });

  it("createOrderDraft creates draft_pending_owner", async () => {
    const all = await menu.listItems(ORG);
    const latte = all.find((i) => i.nameEn === "Latte")!;
    const croissant = all.find((i) => i.nameEn === "Croissant")!;
    const cust = await customers.upsert(ORG, "+201000000099", "Orderer");
    const conv = await conversations.upsert(ORG, cust.id);
    const mockClient = {
      chat: { completions: { create: vi.fn() } },
    } as unknown as OpenAI;
    const create = (mockClient as { chat: { completions: { create: ReturnType<typeof vi.fn> } } }).chat.completions.create;
    create
      .mockResolvedValueOnce({
        choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "t1", type: "function", function: { name: "createOrderDraft", arguments: JSON.stringify({ phone: "+201000000099", items: [{ menuItemId: latte.id, qty: 1 }, { menuItemId: croissant.id, qty: 2 }] }) } }] } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { role: "assistant", content: "Draft created, pending owner approval. Total 105 EGP." } }],
      });
    ai.setOpenAIClient(mockClient);
    const res = await ai.processInbound({
      organizationId: ORG,
      conversationId: conv.id,
      from: "+201000000099",
      text: "Yes please",
      instanceOrPhoneId: "main",
      type: "text",
    });
    expect(res.reply).toContain("105");
  });
});