const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

function extractUsername(value) {
  const trimmed = String(value || "").trim();
  const found = trimmed.match(/^(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?@?([A-Za-z][A-Za-z0-9_]{4,31})(?:\/?(?:\?.*)?)?$/i);
  if (!found || !/bot$/i.test(found[1])) return null;
  return found[1];
}

const menu = {
  keyboard: [
    [{ text: "🔎 Check Bot Link" }, { text: "📋 Ads Checklist" }],
    [{ text: "⏳ In Review Help" }, { text: "ℹ️ Help" }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

function responseFor(text) {
  const input = String(text || "").trim();
  if (/^\/(start|help)(?:@\w+)?(?:\s|$)/i.test(input) || input === "ℹ️ Help") {
    return "👋 សួស្តី! TG Ads Checker Bot\n\nសូមជ្រើស Menu ខាងក្រោម ឬផ្ញើ /check @ExampleBot។\n\n⚠️ Bot នេះមិនអាចអាន Approval ឬ In Review ពិតប្រាកដពី Telegram Ads បានទេ។";
  }
  if (input === "🔎 Check Bot Link") {
    return "🔎 សូមផ្ញើ Bot Username ឬ Link ដូចជា៖\n/check @ExampleBot\nhttps://t.me/ExampleBot\n\nការពិនិត្យនេះគ្រាន់តែពិនិត្យទម្រង់ Username ប៉ុណ្ណោះ។";
  }
  if (input === "📋 Ads Checklist") {
    return "📋 មុនដាក់ Telegram Ads៖\n\n☐ Bot ឆ្លើយ /start\n☐ Profile និង description ច្បាស់លាស់\n☐ Link / Mini App បើកបាន\n☐ Ad text ត្រូវនឹង destination\n☐ ពិនិត្យ Telegram Ads policies\n\n⚠️ Checklist មិនធានាថា Ads នឹង Approved ទេ។";
  }
  if (input === "⏳ In Review Help") {
    return "⏳ Ads នៅ In Review?\n\n• ពិនិត្យ Ad text, link និង destination\n• ពិនិត្យថា Bot និង Mini App ដំណើរការ\n• អាន Telegram Ads policies\n• បើរង់ចាំយូរខុសធម្មតា សូមទាក់ទង Telegram Ads Support តាមផ្លូវការដែលមានក្នុងគណនីអ្នក\n\n⚠️ Bot នេះមិនអាចឆែក Review Status ឬធ្វើឱ្យ Approval លឿនឡើងបានទេ។";
  }
  const candidate = input.replace(/^\/check(?:@\w+)?\s*/i, "").trim();
  const username = extractUsername(candidate);
  if (!username) {
    return "❗ សូមបញ្ចូល Bot Username ឱ្យត្រឹមត្រូវ។\nឧទាហរណ៍៖ /check @ExampleBot\n\nUsername ត្រូវមានយ៉ាងតិច 5 តួអក្សរ និងបញ្ចប់ដោយ bot។";
  }
  return `🔎 Pre-review checklist: @${username}\n\n✅ Username format: valid\n⬜ Bot /start ឆ្លើយតបបានល្អឬទេ?\n⬜ Profile និង description ច្បាស់លាស់ឬទេ?\n⬜ Mini App / landing page ដំណើរការឬទេ?\n⬜ Ad text និង destination ស្របគ្នាឬទេ?\n⬜ គោរព Telegram Ads policies ឬទេ?\n\n⚪ Ads eligibility: មិនអាចបញ្ជាក់បាន\n⚪ Review status: មិនមានទិន្នន័យ\n\nℹ️ ពិនិត្យតែទម្រង់ Link និង Checklist មិនមែន Official Approval ទេ។`;
}

async function sendMessage(chatId, text) {
  const result = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: menu })
  });
  if (!result.ok) {
    const details = await result.text();
    throw new Error(`Telegram sendMessage failed: HTTP ${result.status}: ${details}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!TOKEN || !SECRET) return res.status(503).json({ error: "Bot not configured" });
  if (req.headers["x-telegram-bot-api-secret-token"] !== SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const message = update?.message;
  if (message?.chat?.id && typeof message?.text === "string") {
    await sendMessage(message.chat.id, responseFor(message.text));
  }
  return res.status(200).json({ ok: true });
}
