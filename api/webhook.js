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
    [{ text: "⏳ In Review Help" }, { text: "🧪 Analyze Ad" }],
    [{ text: "ℹ️ Help" }]
  ],
  resize_keyboard: true,
  is_persistent: true
};


async function checkPublicPreview(username) {
  try {
    const response = await fetch(`https://t.me/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(5500),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TGAdsChecker/1.0)" },
      redirect: "follow"
    });
    if (!response.ok) return "⚠️ Public link: HTTP " + response.status + " (មិនអាចបញ្ជាក់បាន)";
    const html = (await response.text()).slice(0, 180000);
    function getPreviewText(className) {
      const marker = 'class="' + className + '"';
      const at = html.indexOf(marker);
      if (at === -1) return "";
      const open = html.indexOf(">", at);
      const close = html.indexOf("</div>", open + 1);
      if (open === -1 || close === -1) return "";
      return html.slice(open + 1, close)
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
    }
    const title = getPreviewText("tgme_page_title");
    const description = getPreviewText("tgme_page_description");
    const hasPhoto = /class="tgme_page_photo"/i.test(html);
    const hasProfile = Boolean(title);
    return [
      hasProfile ? "✅ Public profile preview: FOUND" : "⚠️ Public profile preview: មិនអាចបញ្ជាក់បាន",
      title ? "📝 Public title: " + title.slice(0, 90) : "⚠️ Public title: មិនឃើញ",
      description ? "✅ Public description: មាន" : "⚠️ Public description: មិនឃើញ",
      hasPhoto ? "✅ Public photo element: មាន" : "⚠️ Public photo: មិនឃើញ"
    ].join("\n");
  } catch {
    return "⚠️ Public preview: មិនអាចទាញយកបាន (សាកល្បងម្ដងទៀត)";
  }
}

function analyzeAd(input) {
  const payload = input.replace(/^\\/(?:review|analyze)(?:@\\w+)?\\s*/i, "").trim();
  const separator = payload.lastIndexOf("|");
  if (separator < 0) return "🧪 Ad Review Analyzer\\n\\nសូមផ្ញើតាមទម្រង់៖\\n/review Your ad text | https://t.me/ExampleBot\\n\\nនេះជាការវិភាគបឋម មិនមែនស្ថានភាព Review ផ្លូវការទេ។";
  const adText = payload.slice(0, separator).trim();
  const destination = payload.slice(separator + 1).trim();
  if (!adText || !destination) return "❗ ត្រូវមាន Ad Text និង Destination Link ទាំងពីរ។\\nឧទាហរណ៍៖ /review Try our bot | https://t.me/ExampleBot";
  const count = Array.from(adText).length;
  const issues = [];
  const notes = [];
  if (count > 160) issues.push("❌ Ad Text លើស 160 តួអក្សរ (" + count + ")");
  else notes.push("✅ Ad Text length: " + count + "/160");
  const username = extractUsername(destination);
  if (!username) issues.push("❌ Destination ត្រូវជា Telegram Bot Link ត្រឹមត្រូវ (សម្រាប់ការវិភាគ Bot នេះ)");
  else notes.push("✅ Destination format: @" + username);
  if (/[\\r\\n]/.test(adText)) issues.push("⚠️ Ad Text មានការចុះបន្ទាត់ ដែលមិនអនុញ្ញាតតាមគោលការណ៍");
  const links = adText.match(/(?:https?:\\/\\/)?(?:t\\.me\\/|telegram\\.me\\/)[A-Za-z0-9_]+|@[A-Za-z][A-Za-z0-9_]{4,31}/gi) || [];
  if (links.length > 1) issues.push("⚠️ Ad Text មាន Link ច្រើនជាងមួយ");
  if (links.length === 1 && username) {
    const linked = extractUsername(links[0]);
    if (!linked || linked.toLowerCase() !== username.toLowerCase()) issues.push("⚠️ Link ក្នុង Ad Text អាចមិនត្រូវនឹង Destination");
  }
  if (/https?:\\/\\/(?!t\\.me\\/|telegram\\.me\\/)/i.test(adText)) issues.push("⚠️ Ad Text មាន External Link — ពិនិត្យគោលការណ៍ Link");
  const repeatedEmoji = adText.match(/(?:[\\u{1F300}-\\u{1FAFF}]\\s*){4,}/u);
  if (repeatedEmoji) notes.push("⚠️ មាន Emoji ច្រើនជាប់គ្នា — ពិនិត្យ Editorial Rules");
  const result = [...notes, ...issues].join("\\n");
  return "🧪 Telegram Ads Pre-review Analysis\\n\\n" + result +
    "\\n\\n📋 ត្រូវពិនិត្យដោយខ្លួនឯង៖\\n☐ Bot /start ឆ្លើយលើ Mobile និង Desktop\\n☐ Profile photo និង About/Description ពេញលេញ\\n☐ Destination និង Ad Text ស្របគ្នា\\n☐ មិនមានខ្លឹមសារហាមឃាត់ (ឧ. ល្បែងស៊ីសង ឬការផ្សាយបោកប្រាស់)\\n☐ Targeting និងភាសាសមស្រប\\n\\n⚪ Review status: មិនអាចអានបាន\\n⚪ មូលហេតុ In Review ពិតប្រាកដ: មិនអាចបញ្ជាក់បាន\\n\\n📖 Official guidelines: https://ads.telegram.org/guidelines";
}

async function responseFor(text) {
  const input = String(text || "").trim();
  if (/^\/(start|help)(?:@\w+)?(?:\s|$)/i.test(input) || input === "ℹ️ Help") {
    return "👋 សួស្តី! TG Ads Checker Bot\n\nសូមជ្រើស Menu ខាងក្រោម ឬផ្ញើ /check @ExampleBot។\n\n⚠️ Bot នេះមិនអាចអាន Approval ឬ In Review ពិតប្រាកដពី Telegram Ads បានទេ។";
  }
  if (input === "🔎 Check Bot Link") {
    return "🔎 សូមផ្ញើ Bot Username ឬ Link ដូចជា៖\n/check @ExampleBot\nhttps://t.me/ExampleBot\n\nBot នឹងសាកល្បងពិនិត្យ Telegram public preview និងព័ត៌មានដែលអាចមើលឃើញ។";
  }
  if (input === "📋 Ads Checklist") {
    return "📋 មុនដាក់ Telegram Ads៖\n\n☐ Bot ឆ្លើយ /start\n☐ Profile និង description ច្បាស់លាស់\n☐ Link / Mini App បើកបាន\n☐ Ad text ត្រូវនឹង destination\n☐ ពិនិត្យ Telegram Ads policies\n\n⚠️ Checklist មិនធានាថា Ads នឹង Approved ទេ។";
  }
  if (input === "🧪 Analyze Ad" || /^\\/(review|analyze)(?:@\\w+)?(?:\\s|$)/i.test(input)) {\n    return analyzeAd(input);\n  }\n  if (input === "⏳ In Review Help") {
    return "⏳ Ads នៅ In Review?\n\n• ពិនិត្យ Ad text, link និង destination\n• ពិនិត្យថា Bot និង Mini App ដំណើរការ\n• អាន Telegram Ads policies\n• បើរង់ចាំយូរខុសធម្មតា សូមទាក់ទង Telegram Ads Support តាមផ្លូវការដែលមានក្នុងគណនីអ្នក\n\n⚠️ Bot នេះមិនអាចឆែក Review Status ឬធ្វើឱ្យ Approval លឿនឡើងបានទេ។";
  }
  const candidate = input.replace(/^\/check(?:@\w+)?\s*/i, "").trim();
  const username = extractUsername(candidate);
  if (!username) {
    return "❗ សូមបញ្ចូល Bot Username ឱ្យត្រឹមត្រូវ។\nឧទាហរណ៍៖ /check @ExampleBot\n\nUsername ត្រូវមានយ៉ាងតិច 5 តួអក្សរ និងបញ្ចប់ដោយ bot។";
  }
  const details = await checkPublicPreview(username);
  return `🔎 Advanced Bot Checker: @${username}

✅ Username format: PASS
${details}

📋 ត្រូវពិនិត្យដោយខ្លួនឯង៖
⬜ /start ឆ្លើយតបបានឬទេ?
⬜ Mini App / landing page ដំណើរការឬទេ?
⬜ Ad text និង destination ស្របគ្នាឬទេ?
⬜ គោរព Telegram Ads policies ឬទេ?

⚪ Ads eligibility: មិនអាចបញ្ជាក់បាន
⚪ Review status: មិនមានទិន្នន័យ

ℹ️ Public preview មិនមែនជាភស្តុតាងថា Bot ដំណើរការ ឬ Telegram Ads បាន Approve ទេ។`;
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
    await sendMessage(message.chat.id, await responseFor(message.text));
  }
  return res.status(200).json({ ok: true });
}
