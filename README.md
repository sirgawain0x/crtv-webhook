# Zac-Relay (crtv-webhook)

AgentMail push relay for Creative Platform:

1. AgentMail Console → `POST /api/webhook` (`message.received` only)
2. Verify Svix signature (optional but recommended)
3. Telegram ping (From / Subject / Inbox / Preview)
4. Forward payload to Eve’s Cursor automation webhook

Production URL: `https://webhook-receiver-zac.vercel.app/api/webhook`

## Vercel env vars

| Name | Required | Purpose |
|------|----------|--------|
| `AGENTMAIL_WEBHOOK_SECRET` (or `SVIX_SECRET`) | recommended | Svix signing secret from AgentMail webhook |
| `TELEGRAM_BOT_TOKEN` | for Telegram | Bot token |
| `TELEGRAM_CHAT_ID` | for Telegram | Chat/channel id |
| `EVE_WEBHOOK_URL` | for Eve wake | e.g. `https://api2.cursor.sh/automations/webhook/<id>` |
| `EVE_WEBHOOK_TOKEN` | for Eve wake | Bearer token (with or without `Bearer ` prefix) |
| `REQUIRE_WEBHOOK_SECRET` | optional | set `1` to reject requests when secret missing |

Never commit tokens.

## AgentMail Console

- URL: `https://webhook-receiver-zac.vercel.app/api/webhook`
- Events: **`message.received` only** (do not subscribe to `message.sent`)
- Inboxes: `creative-eve@`, `tmobile@`, `creative-357@`

## Local checks

```bash
npm install
npm test
```

## Notes

- Ignores `message.sent` to avoid outbound loops.
- Parses both `body.message` and `body.data.message`, plus `from` / `from_` / `{email,name}` shapes.
- Always returns `200 { ok: true }` to AgentMail after handling so retries do not storm; check Vercel logs for Telegram/Eve forward errors.
