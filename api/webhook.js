const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

function extractUsername(value) {
  const trimmed = String(value || "").trim();
  const found = trimmed.match(/^(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?@?([A-Za-z][A-Za-z0-9_]{4,31})(?:\/?(?:\?.*)?)?$/i);
  if (!found) return null;
  const username = found[1];
  if (!/bot$/i.test(username)) return null;
  return username;
}

function responseFor(text) {
  const input = String(text || "").trim();
  if (/^\/(start|help)(?:@\w+)?(?:\s|$)/i.test(input)) {
    return "👋 សួស្តី! TG Ads Checker Bot\n\nផ្ញើ /check @ExampleBot ឬ https://t.me/ExampleBot ដើម្បីមើលបញ្ជីត្រួតពិនិត្យមុន Run Ads។\n\n⚠️ ខ្ញុំមិនអាចធានា Approval ឬអាន In Review ពី Telegram Ads ដោយគ្មានការតភ្ជាប់ API ដែលមានសិទ្ធិទេ។";
  }
  const candidate = input.replace(/^\/check(?:@\w+)?\s*/i,"").trim();
  const username = extractUsername(candidate);
  if (!username) {
    return "❗ សូមបញ្ចូល Bot Username ឱ្យបានត្រឹមត្រូវ។\nឧទាហរណ៍៖ /check @ExampleBot\n\nUsername ត្រូវមានយ៉ាងតិច 5 តួអក្សរ និងបញ្ចប់ដោយ bot។";
  }
  return `🔎 Pre-review checklist: @${username}\n\n✅ Username format: valid\n⬜ Bot /start ឆ្លើយតបបានល្អឬទេ? (ត្រូវសាកល្បងផ្ទាល់)\n⬜ Profile image និង description ច្បាស់លាស់ឬទេ?\n⬜ Mini App / landing page ដំណើរការបានល្អឬទេ?\n⬜ Ad text និង destination ស្របគ្នាឬទេ?\n⬜ ខ្លឹមសារគោរព Telegram Ads policies ឬទេ?\n\n⚪ Ads eligibility: មិនអាចបញ្ជាក់បាន\n⚪ Review status: មិនមានទិន្នន័យ\n\nℹ️ នេះគ្រាន់តែជាការពិនិត្យទម្រង់ Link និង Checklist ប៉ុណ្ណោះ មិនមែន Telegram Official Approval ទេ។`;
}

async function sendMessage(chatId, text) {
  const result = await fetch(`${API}/sendMessage`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({chat_id:chatId,text})
  });
  if (!result.ok) throw new Error("Telegram sendMessage failed");
}

export default async function handler(req,res) {
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  if (!TOKEN || !SECRET) return res.status(503).json({error:"Bot not configured"});
  if (req.headers["x-telegram-bot-api-secret-token"] !== SECRET) {
    return res.status(403).json({error:"Forbidden"});
  }
  const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const message = update?.message;
  if (message?.chat?.id && typeof message?.text === "string") {
    await sendMessage(message.chat.id,responseFor(message.text));
  }
  return res.status(200).json({ok:true});
}
