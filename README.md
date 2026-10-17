# TG Ads Checker Bot

Telegram bot that provides a **pre-review readiness checklist** for Telegram Ads destinations. It does **not** determine official ad eligibility, retrieve actual review status, or accelerate Telegram's review queue.

## Deploy (Vercel)
1. Import this GitHub repository into Vercel as a new project (Framework Preset: Other).
2. Add Environment Variables: `TELEGRAM_BOT_TOKEN` (BotFather token) and `TELEGRAM_WEBHOOK_SECRET` (a randomly generated secret using letters, digits, underscore, hyphen; 32+ characters recommended).
3. Deploy and find your production URL, e.g. `https://tg-ads-checker.vercel.app`.
4. In your **own terminal**, register the Telegram webhook, substituting your real values (do not share the token):
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" -d "url=https://<YOUR_VERCEL_DOMAIN>/api/webhook" -d "secret_token=<YOUR_WEBHOOK_SECRET>" -d 'drop_pending_updates=true'
   ```
5. Start the new bot in Telegram. Send `/check @YourTargetBot` or just a bot link.

## Commands
- `/start` - introduce the checker
- `/help` - documentation
- `/check @ExampleBot` - validate a public Telegram bot username/link and show a readiness checklist

## Limitations
Checking a username's syntax doesn't confirm the bot exists, works, is eligible for ads, or has been approved. For real review state, a separately authorized Telegram Ads integration is required where supported. Check Telegram's current advertising policy before submitting ads.

## Safety
Never commit tokens to GitHub or provide them in chat. The endpoint rejects requests without the configured Telegram secret header. This service doesn't persist messages or collect Telegram account credentials.
