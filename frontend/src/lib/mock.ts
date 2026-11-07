export type OrderStatus = "new" | "confirmed" | "preparing" | "out" | "delivered" | "cancelled";

export type Order = {
  id: string;
  customer: string;
  phone: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  address: string;
  payment: "COD" | "Transfer" | "Wallet";
  status: OrderStatus;
  chatId: string;
  createdAt: string;
};

export const orders: Order[] = [
  { id: "ORD-1042", customer: "Ahmed Hassan", phone: "+20 100 123 4567", items: [{ name: "Chicken Shawarma", qty: 2, price: 65 }, { name: "Hummus", qty: 1, price: 25 }], total: 155, address: "Nasr City, Cairo", payment: "COD", status: "new", chatId: "c1", createdAt: "2026-11-07T14:20:00" },
  { id: "ORD-1041", customer: "Sara Ali", phone: "+20 111 222 3333", items: [{ name: "Falafel Wrap", qty: 3, price: 40 }], total: 120, address: "Maadi, Cairo", payment: "Transfer", status: "confirmed", chatId: "c2", createdAt: "2026-11-07T13:05:00" },
  { id: "ORD-1040", customer: "Omar Khaled", phone: "+20 122 333 4444", items: [{ name: "Mixed Grill", qty: 1, price: 180 }, { name: "Rice", qty: 2, price: 30 }], total: 240, address: "Heliopolis, Cairo", payment: "COD", status: "preparing", chatId: "c3", createdAt: "2026-11-07T12:40:00" },
  { id: "ORD-1039", customer: "Mona Youssef", phone: "+20 100 999 8888", items: [{ name: "Chicken Shawarma", qty: 1, price: 65 }], total: 65, address: "Zamalek, Cairo", payment: "Wallet", status: "out", chatId: "c4", createdAt: "2026-11-07T11:15:00" },
  { id: "ORD-1038", customer: "Karim Nasser", phone: "+20 115 555 6666", items: [{ name: "Falafel Wrap", qty: 2, price: 40 }, { name: "Lemonade", qty: 2, price: 20 }], total: 120, address: "Dokki, Giza", payment: "COD", status: "delivered", chatId: "c5", createdAt: "2026-11-06T19:30:00" },
  { id: "ORD-1037", customer: "Laila Mostafa", phone: "+20 128 777 8888", items: [{ name: "Mixed Grill", qty: 2, price: 180 }], total: 360, address: "New Cairo", payment: "Transfer", status: "cancelled", chatId: "c6", createdAt: "2026-11-06T16:10:00" },
];

export type ChatTag = "newOrder" | "question" | "complaint" | "awaitingPayment" | "askedForHuman";

export type Chat = {
  id: string;
  customer: string;
  phone: string;
  lastMessage: string;
  isVoice: boolean;
  tags: ChatTag[];
  orderId?: string;
  agentReason: string;
  time: string;
  unread: boolean;
};

export const chats: Chat[] = [
  { id: "c1", customer: "Ahmed Hassan", phone: "+20 100 123 4567", lastMessage: "I want 2 shawarma and hummus please", isVoice: false, tags: ["newOrder"], orderId: "ORD-1042", agentReason: "Matched menu items 'Chicken Shawarma' x2 and 'Hummus' x1 from catalog; created draft order ORD-1042 awaiting owner confirm.", time: "14:22", unread: true },
  { id: "c2", customer: "Sara Ali", phone: "+20 111 222 3333", lastMessage: "Voice note: 'three falafel wraps, maadi address'", isVoice: true, tags: ["newOrder", "awaitingPayment"], orderId: "ORD-1041", agentReason: "Transcribed voice note → 3x Falafel Wrap; address parsed as Maadi; payment method requested.", time: "13:08", unread: false },
  { id: "c3", customer: "Omar Khaled", phone: "+20 122 333 4444", lastMessage: "How much is the mixed grill?", isVoice: false, tags: ["question"], agentReason: "Quoted price 180 EGP from product catalog (no AI guess).", time: "12:45", unread: false },
  { id: "c4", customer: "Mona Youssef", phone: "+20 100 999 8888", lastMessage: "This is the third time my order is late!!", isVoice: false, tags: ["complaint"], agentReason: "Complaint detected → escalated to owner, no auto-reply sent.", time: "11:20", unread: true },
  { id: "c5", customer: "Karim Nasser", phone: "+20 115 555 6666", lastMessage: "Can I speak to a real person?", isVoice: false, tags: ["askedForHuman"], agentReason: "Human handoff requested → owner notified, agent paused on this chat.", time: "10:05", unread: false },
];

export type Client = {
  id: string;
  name: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  avgOrder: number;
  tags: ("vip" | "returning" | "inactive30")[];
};

export const clients: Client[] = [
  { id: "cl1", name: "Ahmed Hassan", phone: "+20 100 123 4567", orders: 14, totalSpent: 2340, lastOrder: "2026-11-07", avgOrder: 167, tags: ["vip", "returning"] },
  { id: "cl2", name: "Sara Ali", phone: "+20 111 222 3333", orders: 9, totalSpent: 1520, lastOrder: "2026-11-07", avgOrder: 169, tags: ["returning"] },
  { id: "cl3", name: "Omar Khaled", phone: "+20 122 333 4444", orders: 6, totalSpent: 980, lastOrder: "2026-11-07", avgOrder: 163, tags: ["returning"] },
  { id: "cl4", name: "Mona Youssef", phone: "+20 100 999 8888", orders: 4, totalSpent: 410, lastOrder: "2026-11-05", avgOrder: 102, tags: ["inactive30"] },
  { id: "cl5", name: "Karim Nasser", phone: "+20 115 555 6666", orders: 11, totalSpent: 1890, lastOrder: "2026-11-06", avgOrder: 172, tags: ["vip", "returning"] },
  { id: "cl6", name: "Laila Mostafa", phone: "+20 128 777 8888", orders: 2, totalSpent: 360, lastOrder: "2026-10-20", avgOrder: 180, tags: ["inactive30"] },
];

export const ordersLast7 = [12, 18, 9, 22, 15, 20, 24];

export const leads = [
  { id: "l1", name: "Youssef Adel", phone: "+20 109 000 1111", source: "Instagram", status: "new", note: "Asked about catering for 50 people" },
  { id: "l2", name: "Nadia Samir", phone: "+20 112 222 3333", source: "WhatsApp", status: "contacted", note: "Price list sent" },
  { id: "l3", name: "Tarek Fathy", phone: "+20 123 444 5555", source: "Referral", status: "qualified", note: "Wants weekly office lunch" },
];